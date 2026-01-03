/**
 * RRule Manager
 * 
 * Handles recurrence rule parsing and next occurrence calculation
 */

import pkg from 'rrule';
const { RRule, rrulestr } = pkg;

export class RuleManager {
  /**
   * Normalize date to minute precision (set seconds and ms to 0)
   * This ensures we don't miss jobs due to second-level differences
   * 
   * @param {Date} date - Date to normalize
   * @returns {Date} - Normalized date
   */
  static normalizeToMinute(date) {
    const normalized = new Date(date);
    normalized.setSeconds(0);
    normalized.setMilliseconds(0);
    return normalized;
  }

  /**
   * Get the next occurrence of a schedule based on its rrule
   * 
   * @param {string} rruleString - The rrule string (e.g., "FREQ=DAILY;BYHOUR=18;BYMINUTE=49")
   * @param {string} timezone - Timezone (e.g., 'Asia/Kolkata')
   * @returns {Date|null} - Next occurrence in UTC
   */
  static getNextOccurrence(rruleString, timezone = 'UTC') {
    try {
      // Parse the rrule string
      const rule = rrulestr(rruleString);

      // The rrule BYHOUR/BYMINUTE values represent time in the USER's timezone
      // But RRule.after() interprets them as UTC
      // So we need to:
      // 1. Get current time in user's timezone
      // 2. Calculate next occurrence in that timezone
      // 3. Convert back to UTC for storage

      const nowUTC = new Date();
      
      if (timezone && timezone !== 'UTC') {
        // Get timezone offset
        const offset = this.getTimezoneOffsetMs(timezone, nowUTC);
        
        // Convert current time to user's timezone (as UTC representation)
        const nowInUserTz = new Date(nowUTC.getTime() - offset);
        
        // Get next occurrence (interpreted in user's timezone)
        const nextInUserTz = rule.after(nowInUserTz, false);
        
        if (!nextInUserTz) return null;
        
        // Convert back to actual UTC
        const nextUTC = new Date(nextInUserTz.getTime() + offset);
        
        // Normalize to minute precision
        return this.normalizeToMinute(nextUTC);
      } else {
        // UTC timezone - direct calculation
        const next = rule.after(nowUTC, false);
        return next ? this.normalizeToMinute(next) : null;
      }

    } catch (error) {
      console.error('❌ Error parsing rrule:', error);
      return null;
    }
  }

  /**
   * Get timezone offset in milliseconds
   */
  static getTimezoneOffsetMs(timezone, date = new Date()) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const parts = formatter.formatToParts(date);
      const tzParts = {};
      parts.forEach(({ type, value }) => {
        tzParts[type] = value;
      });
      
      const tzDateStr = `${tzParts.year}-${tzParts.month}-${tzParts.day}T${tzParts.hour}:${tzParts.minute}:${tzParts.second}Z`;
      const tzDate = new Date(tzDateStr);
      
      return date.getTime() - tzDate.getTime();
      
    } catch (error) {
      console.error(`Error calculating timezone offset for ${timezone}:`, error);
      return 0;
    }
  }

  /**
   * Get all occurrences between two dates
   * 
   * @param {string} rruleString - The rrule string
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @returns {Date[]} - Array of occurrences
   */
  static getOccurrencesBetween(rruleString, start, end) {
    try {
      const rule = rrulestr(rruleString);
      return rule.between(start, end, true); // true = inclusive

    } catch (error) {
      console.error('❌ Error parsing rrule:', error);
      return [];
    }
  }

  /**
   * Create an rrule string from human-readable parameters
   * 
   * Example usage:
   * - Daily at 9 PM: RuleManager.createRule('DAILY', { hour: 21, minute: 0 })
   * - Weekdays at 6 AM: RuleManager.createRule('DAILY', { hour: 6, minute: 0, byweekday: [0,1,2,3,4] })
   * - Every Monday: RuleManager.createRule('WEEKLY', { byweekday: [0] })
   */
  static createRule(frequency, options = {}) {
    try {
      const config = {
        freq: RRule[frequency] || RRule.DAILY,
        ...options
      };

      const rule = new RRule(config);
      return rule.toString();

    } catch (error) {
      console.error('❌ Error creating rrule:', error);
      throw error;
    }
  }

  /**
   * Validate an rrule string
   * 
   * @param {string} rruleString - The rrule string to validate
   * @returns {boolean} - True if valid
   */
  static isValidRule(rruleString) {
    try {
      rrulestr(rruleString);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a human-readable description of an rrule
   * 
   * @param {string} rruleString - The rrule string
   * @returns {string} - Human-readable description
   */
  static describeRule(rruleString) {
    try {
      const rule = rrulestr(rruleString);
      return rule.toText();
    } catch (error) {
      return 'Invalid rule';
    }
  }

  /**
   * Common schedule patterns
   * These can be used directly in the frontend
   */
  static patterns = {
    // Daily schedules
    DAILY_9PM: 'FREQ=DAILY;BYHOUR=21;BYMINUTE=0',
    DAILY_10AM: 'FREQ=DAILY;BYHOUR=10;BYMINUTE=0',
    DAILY_6PM: 'FREQ=DAILY;BYHOUR=18;BYMINUTE=0',

    // Weekday schedules (Monday-Friday)
    WEEKDAYS_9PM: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=21;BYMINUTE=0',
    WEEKDAYS_6AM: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=6;BYMINUTE=0',

    // Weekend schedules
    WEEKENDS_10AM: 'FREQ=DAILY;BYDAY=SA,SU;BYHOUR=10;BYMINUTE=0',

    // Weekly schedules
    WEEKLY_MONDAY_9AM: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0',
    WEEKLY_FRIDAY_6PM: 'FREQ=WEEKLY;BYDAY=FR;BYHOUR=18;BYMINUTE=0',

    // Monthly schedules
    MONTHLY_FIRST_DAY_9AM: 'FREQ=MONTHLY;BYMONTHDAY=1;BYHOUR=9;BYMINUTE=0',
    MONTHLY_LAST_DAY_6PM: 'FREQ=MONTHLY;BYMONTHDAY=-1;BYHOUR=18;BYMINUTE=0'
  };

  /**
   * Helper: Get pattern by name
   */
  static getPattern(name) {
    return this.patterns[name] || null;
  }

  /**
   * Helper: Get all available patterns
   */
  static getAllPatterns() {
    return Object.entries(this.patterns).map(([name, rule]) => ({
      name,
      rule,
      description: this.describeRule(rule)
    }));
  }
}

/**
 * Example usage in backend API:
 * 
 * import { RuleManager } from './rules.js';
 * 
 * // Create a schedule
 * const schedule = await prisma.schedule.create({
 *   data: {
 *     name: 'Nightly Shutdown',
 *     serverId: 1,
 *     action: 'stop',
 *     rrule: RuleManager.patterns.DAILY_9PM,
 *     nextRunAt: RuleManager.getNextOccurrence(RuleManager.patterns.DAILY_9PM),
 *     enabled: true
 *   }
 * });
 */

