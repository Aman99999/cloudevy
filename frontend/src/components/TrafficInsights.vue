<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p class="text-red-400 font-medium">{{ error}}</p>
        </div>
      </div>
    </div>

    <!-- Insufficient Data -->
    <div v-else-if="!patterns.success" class="space-y-6">
      <!-- Live Data Collection Indicator -->
      <div class="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="relative flex items-center justify-center">
              <span class="absolute w-4 h-4 bg-blue-400 rounded-full animate-ping"></span>
              <span class="relative w-4 h-4 bg-blue-500 rounded-full"></span>
            </div>
            <div>
              <p class="text-white font-semibold">Traffic Data Collection Active</p>
              <p class="text-xs text-gray-400">Real-time metrics being collected every 5 seconds</p>
            </div>
          </div>
          <div class="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/20 rounded-lg">
            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-medium text-blue-400">Live</span>
          </div>
        </div>
      </div>
      
      <!-- Collecting Status -->
      <div class="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
      <div class="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 class="text-xl font-semibold text-white mb-2">Collecting Traffic Data...</h3>
      <p class="text-gray-400 mb-4">{{ patterns.message }}</p>
      <div v-if="patterns.data" class="text-sm text-gray-500">
        <p>Data available: {{ patterns.data.daysAvailable }} days</p>
        <p>{{ patterns.data.estimatedWait }}</p>
      </div>
      </div>
    </div>

    <!-- Traffic Analysis Content -->
    <div v-else class="space-y-6">
      <!-- Live Data Collection Indicator -->
      <div class="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="relative flex items-center justify-center">
              <span class="absolute w-4 h-4 bg-blue-400 rounded-full animate-ping"></span>
              <span class="relative w-4 h-4 bg-blue-500 rounded-full"></span>
            </div>
            <div>
              <p class="text-white font-semibold">Traffic Data Collection Active</p>
              <p class="text-xs text-gray-400">Real-time metrics being collected every 5 seconds</p>
            </div>
          </div>
          <div class="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/20 rounded-lg">
            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm font-medium text-blue-400">Live</span>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-6">
        <div class="flex items-center space-x-3 mb-2">
          <span class="text-3xl">🤖</span>
          <h3 class="text-2xl font-bold text-white">AI-Powered Traffic Analysis</h3>
        </div>
        <p class="text-gray-300 text-sm">
          Based on {{ patterns.data.dataQuality.daysAnalyzed }} days of real-time data
          ({{ patterns.data.dataQuality.confidenceLabel }})
        </p>
      </div>

      <!-- Peak and Low Hours -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Peak Hours -->
        <div class="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6">
          <div class="flex items-center space-x-2 mb-4">
            <span class="text-3xl">🔥</span>
            <h4 class="text-xl font-semibold text-white">Peak Hours</h4>
          </div>
          
          <!-- Weekday Peak -->
          <div v-if="patterns.data.patterns.peaks.weekday" class="mb-4">
            <p class="text-sm text-gray-400 mb-1">{{ patterns.data.patterns.peaks.weekday.days }}</p>
            <p class="text-lg font-bold text-red-400">{{ patterns.data.patterns.peaks.weekday.hours }}</p>
            <p class="text-sm text-gray-300 mt-1">Avg: {{ patterns.data.patterns.peaks.weekday.avgTraffic }} MB/s</p>
            <div class="mt-2 flex items-center space-x-2">
              <div class="flex-1 bg-gray-700/50 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full"
                  :style="{ width: `${patterns.data.patterns.peaks.weekday.confidence * 100}%` }"
                ></div>
              </div>
              <span class="text-xs text-gray-400">{{ (patterns.data.patterns.peaks.weekday.confidence * 100).toFixed(0) }}%</span>
            </div>
          </div>

          <!-- Weekend Peak (if different) -->
          <div v-if="patterns.data.patterns.peaks.weekend" class="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">
            <p>Weekend: {{ patterns.data.patterns.peaks.weekend.hours }}</p>
          </div>
        </div>

        <!-- Low Hours -->
        <div class="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div class="flex items-center space-x-2 mb-4">
            <span class="text-3xl">🌙</span>
            <h4 class="text-xl font-semibold text-white">Low Hours</h4>
          </div>
          
          <div v-if="patterns.data.patterns.lows.everyday">
            <p class="text-sm text-gray-400 mb-1">Every Day</p>
            <p class="text-lg font-bold text-blue-400">{{ patterns.data.patterns.lows.everyday.hours }}</p>
            <p class="text-sm text-gray-300 mt-1">Avg: {{ patterns.data.patterns.lows.everyday.avgTraffic }} MB/s</p>
            <div class="mt-2 flex items-center space-x-2">
              <div class="flex-1 bg-gray-700/50 rounded-full h-2">
                <div 
                  class="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                  :style="{ width: `${patterns.data.patterns.lows.everyday.confidence * 100}%` }"
                ></div>
              </div>
              <span class="text-xs text-gray-400">{{ (patterns.data.patterns.lows.everyday.confidence * 100).toFixed(0) }}%</span>
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ patterns.data.patterns.lows.everyday.consistency }}</p>
          </div>
        </div>
      </div>

      <!-- Trend Analysis -->
      <div v-if="patterns.data.trend.available" class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-2">
            <span class="text-3xl">📈</span>
            <h4 class="text-xl font-semibold text-white">Trend Analysis</h4>
          </div>
          <span 
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              patterns.data.trend.direction === 'increasing' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
            ]"
          >
            {{ patterns.data.trend.direction === 'increasing' ? '↗️ Growing' : '↘️ Declining' }}
          </span>
        </div>
        
        <p class="text-white text-lg mb-2">{{ patterns.data.trend.message }}</p>
        
        <div v-if="patterns.data.trend.forecast" class="mt-4 p-4 bg-gray-800/50 rounded-xl">
          <p class="text-sm text-gray-400 mb-1">Forecast</p>
          <p class="text-white">
            Will reach <span class="font-bold text-purple-400">{{ patterns.data.trend.forecast.predictedTraffic }} MB/s</span>
            by {{ new Date(patterns.data.trend.forecast.date).toLocaleDateString() }}
          </p>
          <p class="text-xs text-gray-500 mt-1">Confidence: {{ patterns.data.trend.forecast.confidence }}</p>
        </div>
      </div>

      <!-- 24-Hour Pattern Chart -->
      <div class="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
        <h4 class="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <span>📊</span>
          <span>24-Hour Traffic Pattern</span>
        </h4>
        <canvas ref="hourlyChartCanvas" class="w-full" style="max-height: 300px;"></canvas>
      </div>

      <!-- Smart Recommendations -->
      <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
        <div class="flex items-center space-x-2 mb-6">
          <span class="text-3xl">💡</span>
          <h4 class="text-xl font-semibold text-white">Smart Recommendations</h4>
        </div>
        
        <div class="space-y-4">
          <div 
            v-for="(rec, index) in patterns.data.recommendations" 
            :key="index"
            class="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/50 transition-all"
          >
            <div class="flex items-start space-x-3">
              <span class="text-2xl flex-shrink-0">{{ rec.icon }}</span>
              <div class="flex-1">
                <h5 class="text-white font-semibold mb-1">{{ rec.title }}</h5>
                <p class="text-gray-300 text-sm mb-2">{{ rec.message }}</p>
                <p class="text-gray-400 text-xs">{{ rec.reason }}</p>
                
                <!-- Action Button for Downtime Recommendation -->
                <button
                  v-if="rec.type === 'downtime_window' && rec.action"
                  @click="$emit('schedule-downtime', rec.action.time)"
                  class="mt-3 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Schedule Downtime at {{ rec.action.time }}</span>
                </button>
                
                <div v-if="rec.confidence" class="mt-2 flex items-center space-x-2">
                  <div class="flex-1 bg-gray-700/50 rounded-full h-1.5">
                    <div 
                      class="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full"
                      :style="{ width: `${rec.confidence * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-500">{{ (rec.confidence * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Anomalies (if any) -->
      <div v-if="patterns.data.anomalies && patterns.data.anomalies.length > 0" class="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
        <div class="flex items-center space-x-2 mb-4">
          <span class="text-3xl">🚨</span>
          <h4 class="text-xl font-semibold text-white">Anomalies Detected</h4>
        </div>
        
        <div class="space-y-3">
          <div 
            v-for="(anomaly, index) in patterns.data.anomalies.slice(0, 5)" 
            :key="index"
            class="bg-gray-800/50 rounded-lg p-3 text-sm"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-white font-medium">{{ new Date(anomaly.timestamp).toLocaleString() }}</span>
              <span 
                :class="[
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                ]"
              >
                {{ anomaly.type === 'spike' ? '↗️' : '↘️' }} {{ anomaly.deviation }}%
              </span>
            </div>
            <p class="text-gray-400 text-xs">{{ anomaly.possibleCause }}</p>
          </div>
        </div>
      </div>

      <!-- Data Quality -->
      <div class="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p class="text-gray-400 text-xs mb-1">Days Analyzed</p>
            <p class="text-white font-bold text-lg">{{ patterns.data.dataQuality.daysAnalyzed }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs mb-1">Data Points</p>
            <p class="text-white font-bold text-lg">{{ patterns.data.dataQuality.dataPoints }}</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs mb-1">Coverage</p>
            <p class="text-white font-bold text-lg">{{ patterns.data.dataQuality.coverage }}%</p>
          </div>
          <div>
            <p class="text-gray-400 text-xs mb-1">Confidence</p>
            <p class="text-white font-bold text-lg">{{ patterns.data.dataQuality.confidence.replace('_', ' ') }}</p>
          </div>
        </div>
        
        <div class="mt-4 flex items-center justify-between">
          <p class="text-gray-500 text-xs">Last updated: {{ new Date(patterns.data.dataQuality.lastUpdated).toLocaleString() }}</p>
          <button
            @click="$emit('refresh')"
            class="px-3 py-1 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps({
  serverId: {
    type: Number,
    required: true
  },
  patterns: {
    type: Object,
    default: () => ({ success: false })
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
});

defineEmits(['schedule-downtime', 'refresh']);

const hourlyChartCanvas = ref(null);
let hourlyChart = null;

// Create 24-hour pattern chart
watch(() => props.patterns, (newPatterns) => {
  if (newPatterns.success && newPatterns.data?.hourlyPattern) {
    nextTick(() => {
      createHourlyChart();
    });
  }
}, { immediate: true });

function createHourlyChart() {
  if (!hourlyChartCanvas.value) return;
  
  // Destroy existing chart
  if (hourlyChart) {
    hourlyChart.destroy();
  }

  const ctx = hourlyChartCanvas.value.getContext('2d');
  const hourlyData = props.patterns.data.hourlyPattern;

  hourlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hourlyData.map(h => h.label),
      datasets: [{
        label: 'Avg Traffic (MB/s)',
        data: hourlyData.map(h => h.avgTraffic),
        backgroundColor: (context) => {
          const value = context.parsed.y;
          const max = Math.max(...hourlyData.map(h => h.avgTraffic));
          const intensity = value / max;
          return `rgba(99, 102, 241, ${0.2 + (intensity * 0.6)})`;
        },
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#fff',
          bodyColor: '#9ca3af',
          borderColor: '#374151',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (context) => `${context.parsed.y.toFixed(2)} MB/s`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(75, 85, 99, 0.2)',
            drawBorder: false
          },
          ticks: {
            color: '#9ca3af',
            font: {
              size: 10
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(75, 85, 99, 0.2)',
            drawBorder: false
          },
          ticks: {
            color: '#9ca3af',
            callback: (value) => `${value} MB/s`
          }
        }
      }
    }
  });
}

onMounted(() => {
  if (props.patterns.success && props.patterns.data?.hourlyPattern) {
    createHourlyChart();
  }
});
</script>

