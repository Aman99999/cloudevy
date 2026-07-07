/**
 * Traffic Analyzer Service
 * Provides ML-style pattern detection, trend analysis, and smart recommendations
 * for network traffic data without external ML libraries.
 */

export class TrafficAnalyzer {
  
  /**
   * Analyze traffic patterns and generate insights
   * @param {Array} hourlyData - Array of hourly traffic records
   * @param {Object} server - Server object
   * @returns {Object} Complete analysis with patterns, trends, anomalies, and recommendations
   */
  analyzeTraffic(hourlyData, server) {
    if (!hourlyData || hourlyData.length < 24) {
      return this.getInsufficientDataResponse(hourlyData?.length || 0);
    }

    const totalTraffic = hourlyData.map(h => ({
      timestamp: new Date(h.hourTimestamp),
      traffic: parseFloat(h.avgInMbps) + parseFloat(h.avgOutMbps),
      inTraffic: parseFloat(h.avgInMbps),
      outTraffic: parseFloat(h.avgOutMbps)
    }));

    const patterns = this.detectPatterns(totalTraffic);
    const trend = this.analyzeTrend(totalTraffic);
    const anomalies = this.findAnomalies(totalTraffic);
    const recommendations = this.generateRecommendations(patterns, trend, anomalies, server);
    const dataQuality = this.assessDataQuality(hourlyData);

    return {
      success: true,
      data: {
        patterns,
        trend,
        anomalies,
        recommendations,
        dataQuality,
        hourlyPattern: this.get24HourPattern(totalTraffic),
        weeklyHeatmap: this.getWeeklyHeatmap(totalTraffic)
      }
    };
  }

  /**
   * Detect peak and low traffic patterns with confidence scores
   */
  detectPatterns(trafficData) {
    const byHour = this.groupByHour(trafficData);
    const byDayHour = this.groupByDayAndHour(trafficData);
    
    const stats = this.calculateStats(byHour.map(h => h.avgTraffic));
    const threshold = stats.mean + (stats.stdDev * 0.5);
    const lowThreshold = stats.mean - (stats.stdDev * 0.5);

    // Find peak hours
    const peakHours = byHour.filter(h => h.avgTraffic > threshold);
    const peaksByDay = this.groupByWeekday(byDayHour.filter(h => h.avgTraffic > threshold));
    
    // Find low hours
    const lowHours = byHour.filter(h => h.avgTraffic < lowThreshold);
    const lowsByDay = this.groupByWeekday(byDayHour.filter(h => h.avgTraffic < lowThreshold));

    // Determine if patterns are weekday/weekend specific
    const weekdayPeaks = peaksByDay.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5);
    const weekendPeaks = peaksByDay.filter(d => d.dayOfWeek === 0 || d.dayOfWeek === 6);

    return {
      peaks: this.formatPeakLowPattern(peakHours, weekdayPeaks, weekendPeaks, 'peak'),
      lows: this.formatPeakLowPattern(lowHours, lowsByDay.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5), lowsByDay.filter(d => d.dayOfWeek === 0 || d.dayOfWeek === 6), 'low'),
      peakDay: this.findPeakDay(byDayHour)
    };
  }

  /**
   * Analyze traffic trends (increasing/decreasing)
   */
  analyzeTrend(trafficData) {
    if (trafficData.length < 14 * 24) {
      return { available: false, reason: 'Need at least 14 days of data for trend analysis' };
    }

    // Group by week
    const weeklyAvgs = this.groupByWeek(trafficData);
    if (weeklyAvgs.length < 2) {
      return { available: false, reason: 'Need at least 2 weeks of data' };
    }

    // Linear regression on weekly averages
    const regression = this.linearRegression(weeklyAvgs.map((w, i) => ({ x: i, y: w.avgTraffic })));
    
    const firstWeek = weeklyAvgs[0].avgTraffic;
    const lastWeek = weeklyAvgs[weeklyAvgs.length - 1].avgTraffic;
    const changeRate = (lastWeek - firstWeek) / firstWeek;
    
    const direction = regression.slope > 0 ? 'increasing' : 'decreasing';
    const isSignificant = Math.abs(changeRate) > 0.05; // 5% threshold

    return {
      available: true,
      direction,
      rate: Math.abs(changeRate),
      changePercent: (changeRate * 100).toFixed(1),
      isSignificant,
      slope: regression.slope,
      r2: regression.r2,
      forecast: this.forecastNextWeek(weeklyAvgs, regression),
      message: this.getTrendMessage(direction, changeRate, isSignificant),
      weeklyData: weeklyAvgs
    };
  }

  /**
   * Find traffic anomalies using Z-score method
   */
  findAnomalies(trafficData) {
    const stats = this.calculateStats(trafficData.map(d => d.traffic));
    const anomalies = [];

    trafficData.forEach(point => {
      const zScore = (point.traffic - stats.mean) / stats.stdDev;
      
      if (Math.abs(zScore) > 3) { // 3 standard deviations
        const severity = Math.abs(zScore) > 4 ? 'critical' : 'high';
        const type = zScore > 0 ? 'spike' : 'drop';
        
        anomalies.push({
          timestamp: point.timestamp.toISOString(),
          traffic: point.traffic.toFixed(2),
          expected: stats.mean.toFixed(2),
          deviation: ((point.traffic - stats.mean) / stats.mean * 100).toFixed(1),
          zScore: zScore.toFixed(2),
          severity,
          type,
          possibleCause: this.inferAnomalyCause(point, type, zScore)
        });
      }
    });

    return anomalies.slice(0, 10); // Return top 10 anomalies
  }

  /**
   * Generate smart recommendations
   */
  generateRecommendations(patterns, trend, anomalies, server) {
    const recommendations = [];

    // 1. Best downtime window
    if (patterns.lows.everyday && patterns.lows.everyday.hours) {
      const lowWindow = patterns.lows.everyday.hours.split(' - ');
      recommendations.push({
        priority: 1,
        type: 'downtime_window',
        icon: '🕐',
        title: 'Best Maintenance Window',
        message: `Schedule maintenance at ${patterns.lows.everyday.hours} daily`,
        window: patterns.lows.everyday.hours,
        confidence: patterns.lows.everyday.confidence,
        reason: `Average traffic only ${patterns.lows.everyday.avgTraffic} MB/s (${((1 - patterns.lows.everyday.avgTraffic / (patterns.peaks.weekday?.avgTraffic || 10)) * 100).toFixed(0)}% lower than peak)`,
        action: {
          type: 'schedule_downtime',
          time: lowWindow[0]
        }
      });
    }

    // 2. Capacity planning
    if (trend.available && trend.isSignificant && trend.direction === 'increasing') {
      recommendations.push({
        priority: 2,
        type: 'capacity_planning',
        icon: '📈',
        title: 'Traffic Growing',
        message: `Consider upgrading instance size`,
        reason: `Traffic increasing ${trend.changePercent}% per week`,
        forecast: trend.forecast ? `Will reach ${trend.forecast.predictedTraffic} MB/s by ${trend.forecast.date}` : null,
        action: {
          type: 'upgrade_instance',
          current: server.instanceType || 'unknown',
          recommended: this.suggestInstanceUpgrade(server.instanceType, trend.rate)
        }
      });
    }

    // 3. Avoid maintenance during peak
    if (patterns.peaks.weekday && patterns.peaks.weekday.hours) {
      recommendations.push({
        priority: 3,
        type: 'avoid_maintenance',
        icon: '⚠️',
        title: 'High Traffic Period',
        message: `Avoid maintenance during ${patterns.peaks.weekday.days}: ${patterns.peaks.weekday.hours}`,
        confidence: patterns.peaks.weekday.confidence,
        reason: `Peak traffic hours (${patterns.peaks.weekday.avgTraffic} MB/s)`,
        impact: 'High user activity - service disruption would affect many users'
      });
    }

    // 4. Anomaly alerts
    if (anomalies.length > 5) {
      recommendations.push({
        priority: 4,
        type: 'anomaly_alert',
        icon: '🚨',
        title: 'Frequent Anomalies Detected',
        message: `${anomalies.length} unusual traffic patterns in last 7 days`,
        reason: 'Multiple spikes or drops detected',
        action: {
          type: 'review_anomalies',
          count: anomalies.length
        }
      });
    }

    // 5. Scale-up timing
    if (patterns.peakDay && patterns.peakDay.avgTraffic > 0) {
      const peakDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][patterns.peakDay.dayOfWeek];
      recommendations.push({
        priority: 5,
        type: 'scale_timing',
        icon: '🎯',
        title: 'Proactive Scaling',
        message: `Consider scaling up before ${peakDayName} ${patterns.peakDay.peakHour}:00`,
        reason: `Historically highest traffic day/time (${patterns.peakDay.avgTraffic.toFixed(1)} MB/s)`,
        action: {
          type: 'auto_scale',
          day: patterns.peakDay.dayOfWeek,
          hour: patterns.peakDay.peakHour - 1 // Scale 1 hour before
        }
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  // ==================== Helper Methods ====================

  groupByHour(trafficData) {
    const hourMap = {};
    
    trafficData.forEach(point => {
      const hour = point.timestamp.getHours();
      if (!hourMap[hour]) {
        hourMap[hour] = { hour, total: 0, count: 0 };
      }
      hourMap[hour].total += point.traffic;
      hourMap[hour].count++;
    });

    return Object.values(hourMap).map(h => ({
      hour: h.hour,
      avgTraffic: h.total / h.count,
      samples: h.count
    })).sort((a, b) => a.hour - b.hour);
  }

  groupByDayAndHour(trafficData) {
    const dayHourMap = {};
    
    trafficData.forEach(point => {
      const day = point.timestamp.getDay();
      const hour = point.timestamp.getHours();
      const key = `${day}-${hour}`;
      
      if (!dayHourMap[key]) {
        dayHourMap[key] = { day, hour, total: 0, count: 0 };
      }
      dayHourMap[key].total += point.traffic;
      dayHourMap[key].count++;
    });

    return Object.values(dayHourMap).map(dh => ({
      dayOfWeek: dh.day,
      hour: dh.hour,
      avgTraffic: dh.total / dh.count,
      samples: dh.count
    }));
  }

  groupByWeekday(data) {
    const weekdayMap = {};
    
    data.forEach(point => {
      const day = point.dayOfWeek;
      if (!weekdayMap[day]) {
        weekdayMap[day] = { dayOfWeek: day, hours: [], traffic: [] };
      }
      weekdayMap[day].hours.push(point.hour);
      weekdayMap[day].traffic.push(point.avgTraffic);
    });

    return Object.values(weekdayMap);
  }

  groupByWeek(trafficData) {
    const weekMap = {};
    
    trafficData.forEach(point => {
      const weekStart = new Date(point.timestamp);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { week: weekKey, total: 0, count: 0 };
      }
      weekMap[weekKey].total += point.traffic;
      weekMap[weekKey].count++;
    });

    return Object.values(weekMap).map(w => ({
      week: w.week,
      avgTraffic: w.total / w.count
    })).sort((a, b) => a.week.localeCompare(b.week));
  }

  calculateStats(values) {
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    return { mean, variance, stdDev, count: n };
  }

  linearRegression(points) {
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + (p.x * p.y), 0);
    const sumX2 = points.reduce((sum, p) => sum + (p.x * p.x), 0);
    const sumY2 = points.reduce((sum, p) => sum + (p.y * p.y), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R²
    const meanY = sumY / n;
    const ssRes = points.reduce((sum, p) => sum + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const r2 = 1 - (ssRes / ssTot);
    
    return { slope, intercept, r2 };
  }

  forecastNextWeek(weeklyData, regression) {
    const nextWeekIndex = weeklyData.length;
    const predictedTraffic = (regression.slope * nextWeekIndex + regression.intercept).toFixed(1);
    
    const nextWeekDate = new Date(weeklyData[weeklyData.length - 1].week);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    
    return {
      predictedTraffic,
      date: nextWeekDate.toISOString().split('T')[0],
      confidence: regression.r2 > 0.7 ? 'high' : regression.r2 > 0.4 ? 'medium' : 'low'
    };
  }

  formatPeakLowPattern(allHours, weekdayData, weekendData, type) {
    const result = {};

    if (allHours.length > 0) {
      const sortedHours = allHours.sort((a, b) => a.hour - b.hour);
      const consecutiveRanges = this.findConsecutiveRanges(sortedHours.map(h => h.hour));
      const avgTraffic = allHours.reduce((sum, h) => sum + h.avgTraffic, 0) / allHours.length;
      const totalSamples = allHours.reduce((sum, h) => sum + h.samples, 0);
      
      result.everyday = {
        hours: this.formatHourRanges(consecutiveRanges),
        avgTraffic: avgTraffic.toFixed(1),
        confidence: this.calculateConfidence(totalSamples, allHours.map(h => h.avgTraffic)),
        consistency: this.getConsistencyLabel(totalSamples / (allHours.length * 24))
      };
    }

    if (weekdayData.length > 0) {
      result.weekday = this.formatDayPattern(weekdayData, 'Mon-Fri');
    }

    if (weekendData.length > 0) {
      result.weekend = this.formatDayPattern(weekendData, 'Sat-Sun');
    }

    return result;
  }

  formatDayPattern(dayData, days) {
    const allHours = dayData.flatMap(d => d.hours);
    const allTraffic = dayData.flatMap(d => d.traffic);
    
    const uniqueHours = [...new Set(allHours)].sort((a, b) => a - b);
    const consecutiveRanges = this.findConsecutiveRanges(uniqueHours);
    const avgTraffic = allTraffic.reduce((sum, t) => sum + t, 0) / allTraffic.length;
    
    return {
      days,
      hours: this.formatHourRanges(consecutiveRanges),
      avgTraffic: avgTraffic.toFixed(1),
      confidence: this.calculateConfidence(allTraffic.length, allTraffic),
      peakDay: this.getDayName(dayData.sort((a, b) => 
        (b.traffic.reduce((s, t) => s + t, 0) / b.traffic.length) - 
        (a.traffic.reduce((s, t) => s + t, 0) / a.traffic.length)
      )[0]?.dayOfWeek)
    };
  }

  findConsecutiveRanges(hours) {
    if (hours.length === 0) return [];
    
    const ranges = [];
    let start = hours[0];
    let prev = hours[0];
    
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] !== prev + 1) {
        ranges.push({ start, end: prev });
        start = hours[i];
      }
      prev = hours[i];
    }
    ranges.push({ start, end: prev });
    
    return ranges;
  }

  formatHourRanges(ranges) {
    return ranges.map(r => {
      const start = this.formatHour(r.start);
      const end = this.formatHour((r.end + 1) % 24);
      return r.start === r.end ? start : `${start} - ${end}`;
    }).join(', ');
  }

  formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  calculateConfidence(sampleCount, values) {
    const variance = this.calculateStats(values).variance;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const cv = variance > 0 ? Math.sqrt(variance) / mean : 0; // Coefficient of variation
    
    // More samples and lower variability = higher confidence
    const sampleScore = Math.min(sampleCount / 100, 1); // Normalize to 0-1
    const consistencyScore = Math.max(0, 1 - cv); // Lower CV = higher score
    
    const confidence = (sampleScore * 0.6 + consistencyScore * 0.4);
    return parseFloat((confidence * 100).toFixed(0)) / 100; // Round to 2 decimals
  }

  getConsistencyLabel(ratio) {
    if (ratio > 0.9) return 'Very High - consistent daily';
    if (ratio > 0.7) return 'High - occurs most days';
    if (ratio > 0.5) return 'Medium - occurs often';
    return 'Low - occasional';
  }

  findPeakDay(byDayHour) {
    const dayTraffic = {};
    
    byDayHour.forEach(dh => {
      if (!dayTraffic[dh.dayOfWeek]) {
        dayTraffic[dh.dayOfWeek] = { total: 0, count: 0, maxHour: 0, maxTraffic: 0 };
      }
      dayTraffic[dh.dayOfWeek].total += dh.avgTraffic;
      dayTraffic[dh.dayOfWeek].count++;
      
      if (dh.avgTraffic > dayTraffic[dh.dayOfWeek].maxTraffic) {
        dayTraffic[dh.dayOfWeek].maxTraffic = dh.avgTraffic;
        dayTraffic[dh.dayOfWeek].maxHour = dh.hour;
      }
    });

    const peakDay = Object.entries(dayTraffic).reduce((max, [day, data]) => {
      const avg = data.total / data.count;
      return avg > max.avgTraffic ? { dayOfWeek: parseInt(day), avgTraffic: avg, peakHour: data.maxHour } : max;
    }, { dayOfWeek: 0, avgTraffic: 0, peakHour: 0 });

    return peakDay;
  }

  getDayName(dayOfWeek) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
  }

  get24HourPattern(trafficData) {
    const byHour = this.groupByHour(trafficData);
    return byHour.map(h => ({
      hour: h.hour,
      avgTraffic: parseFloat(h.avgTraffic.toFixed(2)),
      label: this.formatHour(h.hour)
    }));
  }

  getWeeklyHeatmap(trafficData) {
    const byDayHour = this.groupByDayAndHour(trafficData);
    
    // Create a 7x24 grid
    const heatmap = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const data = byDayHour.find(dh => dh.dayOfWeek === day && dh.hour === hour);
        heatmap.push({
          day,
          hour,
          dayName: this.getDayName(day),
          avgTraffic: data ? parseFloat(data.avgTraffic.toFixed(2)) : 0
        });
      }
    }
    
    return heatmap;
  }

  inferAnomalyCause(point, type, zScore) {
    const hour = point.timestamp.getHours();
    
    if (type === 'spike') {
      if (hour >= 2 && hour <= 5) return 'Batch job or scheduled task';
      if (Math.abs(zScore) > 5) return 'Possible DDoS attack or viral traffic';
      return 'Marketing campaign, viral content, or legitimate traffic surge';
    } else {
      if (hour >= 2 && hour <= 5) return 'Normal overnight low activity';
      return 'Service outage, network issue, or scheduled maintenance';
    }
  }

  getTrendMessage(direction, changeRate, isSignificant) {
    if (!isSignificant) {
      return 'Traffic is stable with no significant trend';
    }
    
    const percentChange = Math.abs(changeRate * 100).toFixed(1);
    if (direction === 'increasing') {
      return `Traffic growing ${percentChange}% per week`;
    } else {
      return `Traffic decreasing ${percentChange}% per week`;
    }
  }

  suggestInstanceUpgrade(currentType, growthRate) {
    if (!currentType) return null;
    
    // Simple upgrade suggestions
    const upgrades = {
      't3.micro': 't3.small',
      't3.small': 't3.medium',
      't3.medium': 't3.large',
      't3.large': 't3.xlarge',
      't2.micro': 't2.small',
      't2.small': 't2.medium',
      't2.medium': 't2.large'
    };
    
    return upgrades[currentType] || 'Consult with cloud provider';
  }

  assessDataQuality(hourlyData) {
    const daysAnalyzed = hourlyData.length / 24;
    const coverage = (hourlyData.filter(h => h.samplesCount > 0).length / hourlyData.length * 100).toFixed(1);
    
    let confidence = 'low';
    if (daysAnalyzed >= 30 && coverage > 95) confidence = 'very_high';
    else if (daysAnalyzed >= 14 && coverage > 90) confidence = 'high';
    else if (daysAnalyzed >= 7 && coverage > 80) confidence = 'medium';
    
    return {
      daysAnalyzed: Math.floor(daysAnalyzed),
      dataPoints: hourlyData.length,
      coverage: parseFloat(coverage),
      confidence,
      confidenceLabel: this.getConfidenceLabel(confidence),
      lastUpdated: new Date().toISOString()
    };
  }

  getConfidenceLabel(confidence) {
    const labels = {
      'very_high': '⭐⭐⭐⭐⭐ Very High',
      'high': '⭐⭐⭐⭐ High',
      'medium': '⭐⭐⭐ Medium',
      'low': '⭐⭐ Low'
    };
    return labels[confidence] || labels.low;
  }

  getInsufficientDataResponse(hoursAvailable) {
    const daysAvailable = Math.floor(hoursAvailable / 24);
    const daysNeeded = Math.max(1, 7 - daysAvailable);
    
    return {
      success: false,
      error: 'insufficient_data',
      message: `Traffic analysis requires at least 7 days of data. Currently have ${daysAvailable} days.`,
      data: {
        daysAvailable,
        daysNeeded,
        hoursAvailable,
        hoursNeeded: daysNeeded * 24,
        estimatedWait: `Check back in ${daysNeeded} ${daysNeeded === 1 ? 'day' : 'days'}`
      }
    };
  }
}

export default new TrafficAnalyzer();

