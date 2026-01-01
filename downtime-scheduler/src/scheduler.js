/**
 * Core Scheduler Logic
 * 
 * Polls database for scheduled actions and executes them
 */

import prisma from './config/prisma.js';
import { executeSchedule } from './executor.js';
import { RuleManager } from './rules.js';

class Scheduler {
  constructor() {
    this.checkInterval = 10000; // Check every 10 seconds
    this.running = false;
    this.inProgress = new Set(); // Track in-progress executions
  }

  async start() {
    console.log('🕐 Starting Scheduler Service...');
    console.log(`   Check interval: ${this.checkInterval / 1000}s`);
    console.log('');
    
    this.running = true;
    
    // Run initial check immediately
    await this.checkSchedules();
    
    // Then continue with interval
    await this.mainLoop();
  }

  async mainLoop() {
    while (this.running) {
      await this.sleep(this.checkInterval);
      
      if (this.running) {
        await this.checkSchedules();
      }
    }
  }

  async checkSchedules() {
    const now = new Date();
    const checkWindow = new Date(now.getTime() + 2 * 60000); // Look 2 minutes ahead
    
    try {
      // Get all enabled schedules that should run soon
      const schedules = await prisma.schedule.findMany({
        where: {
          enabled: true,
          nextRunAt: {
            lte: checkWindow
          }
        },
        include: {
          server: {
            include: {
              cloudAccount: true
            }
          }
        }
      });

      if (schedules.length > 0) {
        console.log(`📋 Found ${schedules.length} schedule(s) to check at ${now.toISOString()}`);
      }

      // Check each schedule
      for (const schedule of schedules) {
        // Skip if already in progress
        if (this.inProgress.has(schedule.id)) {
          console.log(`⏭️  Skipping schedule ${schedule.id} (already in progress)`);
          continue;
        }

        const shouldRun = this.shouldRunNow(schedule, now);
        
        if (shouldRun) {
          console.log(`▶️  Executing schedule: ${schedule.name} (ID: ${schedule.id})`);
          
          // Execute asynchronously (don't block)
          this.executeAndUpdate(schedule).catch(error => {
            console.error(`❌ Error executing schedule ${schedule.id}:`, error);
          });
        }
      }

    } catch (error) {
      console.error('❌ Error checking schedules:', error);
    }
  }

  shouldRunNow(schedule, now) {
    // Normalize both times to minute precision (HH:MM:00)
    // This ensures we don't miss schedules due to second-level differences
    const nextRun = this.normalizeToMinute(new Date(schedule.nextRunAt));
    const currentTime = this.normalizeToMinute(now);
    
    // Check if current minute matches scheduled minute
    // OR if we're within the execution window (for missed checks)
    const diff = Math.abs(currentTime - nextRun);
    
    // Execute if:
    // 1. Exact minute match (diff = 0)
    // 2. Within 15-second window (in case we missed the exact minute)
    return diff < 15000;
  }

  normalizeToMinute(date) {
    const normalized = new Date(date);
    normalized.setSeconds(0);
    normalized.setMilliseconds(0);
    return normalized;
  }

  async executeAndUpdate(schedule) {
    // Mark as in progress
    this.inProgress.add(schedule.id);
    
    try {
      // Execute the schedule
      await executeSchedule(schedule);
      
      // Calculate next run time
      await this.updateNextRun(schedule);
      
    } catch (error) {
      console.error(`❌ Failed to execute schedule ${schedule.id}:`, error);
    } finally {
      // Remove from in-progress
      this.inProgress.delete(schedule.id);
    }
  }

  async updateNextRun(schedule) {
    try {
      // Calculate next occurrence using rrule
      const nextRun = RuleManager.getNextOccurrence(schedule.rrule, schedule.timezone);
      
      if (nextRun) {
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt: nextRun,
            executionCount: { increment: 1 }
          }
        });
        
        console.log(`✅ Updated schedule ${schedule.id}, next run: ${nextRun.toISOString()}`);
      } else {
        // No more occurrences, disable schedule
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            enabled: false,
            lastRunAt: new Date()
          }
        });
        
        console.log(`⏹️  Schedule ${schedule.id} completed (no more occurrences)`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating next run for schedule ${schedule.id}:`, error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 Stopping Scheduler Service...');
    this.running = false;
    
    // Wait for in-progress executions to complete
    if (this.inProgress.size > 0) {
      console.log(`⏳ Waiting for ${this.inProgress.size} in-progress execution(s) to complete...`);
      
      // Wait up to 30 seconds
      const maxWait = 30000;
      const checkInterval = 1000;
      let waited = 0;
      
      while (this.inProgress.size > 0 && waited < maxWait) {
        await this.sleep(checkInterval);
        waited += checkInterval;
      }
      
      if (this.inProgress.size > 0) {
        console.log(`⚠️  Timeout waiting for executions, ${this.inProgress.size} still in progress`);
      } else {
        console.log('✅ All executions completed');
      }
    }
    
    console.log('✅ Scheduler Service stopped');
  }
}

export default Scheduler;

