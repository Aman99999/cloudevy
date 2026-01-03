/**
 * Scheduled Downtime API Routes
 * 
 * Handles CRUD operations for server schedules
 */

import express from 'express';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import rrulePkg from 'rrule';
const { RRule } = rrulePkg;

const router = express.Router();

// Helper: Normalize date to minute precision (no seconds/milliseconds)
function normalizeToMinute(date) {
  const normalized = new Date(date);
  normalized.setSeconds(0);
  normalized.setMilliseconds(0);
  return normalized;
}

// Helper: Get timezone offset in milliseconds
// Returns the offset to ADD to UTC to get local time
// e.g., for "Asia/Kolkata" (UTC+5:30), returns +19800000 ms
function getTimezoneOffsetMs(timezone, date = new Date()) {
  try {
    // Create a formatter for the target timezone
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
    
    // Get parts in target timezone
    const parts = formatter.formatToParts(date);
    const tzParts = {};
    parts.forEach(({ type, value }) => {
      tzParts[type] = value;
    });
    
    // Construct date string in target timezone (interpret as UTC)
    const tzDateStr = `${tzParts.year}-${tzParts.month}-${tzParts.day}T${tzParts.hour}:${tzParts.minute}:${tzParts.second}Z`;
    const tzDate = new Date(tzDateStr);
    
    // The difference is the offset
    // Example: If UTC is 13:19 and IST is 18:49, offset = 13:19 - 18:49 = -5:30 hours = -19800000 ms
    // We return the NEGATIVE of this to get the "add to UTC" offset
    return date.getTime() - tzDate.getTime();
    
  } catch (error) {
    console.error(`Error calculating timezone offset for ${timezone}:`, error);
    return 0; // Fallback to UTC
  }
}

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/schedules
 * List all schedules for the workspace
 */
router.get('/', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;
    const { serverId } = req.query;

    const where = { workspaceId };
    if (serverId) {
      where.serverId = parseInt(serverId);
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        server: {
          select: {
            id: true,
            name: true,
            provider: true,
            status: true
          }
        },
        executions: {
          take: 5,
          orderBy: { executedAt: 'desc' },
          select: {
            id: true,
            action: true,
            status: true,
            executedAt: true,
            duration: true
          }
        }
      },
      orderBy: { nextRunAt: 'asc' }
    });

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    console.error('List schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list schedules'
    });
  }
});

/**
 * GET /api/schedules/:id
 * Get schedule details with execution history
 */
router.get('/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        workspaceId
      },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            provider: true,
            status: true,
            instanceId: true
          }
        },
        executions: {
          take: 20,
          orderBy: { executedAt: 'desc' }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule'
    });
  }
});

/**
 * POST /api/schedules
 * Create a new schedule
 */
router.post('/', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;
    const { 
      serverId, name, action, rrule, timezone = 'UTC', 
      targetInstanceType, originalInstanceType,
      targetVolumeSize, targetVolumeType, targetVolumeIops, targetVolumeThroughput,
      originalVolumeSize, originalVolumeType, originalVolumeIops, originalVolumeThroughput
    } = req.body;

    // Validate required fields
    if (!serverId || !name || !action || !rrule) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: serverId, name, action, rrule'
      });
    }

    // Validate action
    if (!['stop', 'start', 'reboot', 'scale_down', 'scale_up'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be: stop, start, reboot, scale_down, or scale_up'
      });
    }

    // Validate scaling actions have at least one target
    if ((action === 'scale_down' || action === 'scale_up')) {
      if (!targetInstanceType && !targetVolumeSize && !targetVolumeType && !targetVolumeIops && !targetVolumeThroughput) {
        return res.status(400).json({
          success: false,
          message: 'At least one target configuration (instance type or volume) is required for scaling actions'
        });
      }
    }

    // Verify server belongs to workspace
    const server = await prisma.server.findFirst({
      where: {
        id: parseInt(serverId),
        workspaceId
      }
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server not found'
      });
    }

    // Validate and calculate next run from rrule
    let nextRunAt;
    try {
      // RRule interprets BYHOUR/BYMINUTE in **local time** (where Node.js is running)
      // But we need to interpret it in the **user's timezone** (e.g., Asia/Kolkata)
      // 
      // Strategy:
      // 1. Get current time in UTC
      // 2. Convert to user's timezone
      // 3. Calculate next occurrence in that timezone
      // 4. Convert back to UTC for storage
      
      const rule = RRule.fromString(rrule);
      const nowUTC = new Date();
      
      // Get the timezone offset (negative for UTC+)
      // e.g., for "Asia/Kolkata" (UTC+5:30) this is -19800000 ms
      const userTzOffset = getTimezoneOffsetMs(timezone, nowUTC);
      
      // Convert current time to user's timezone
      // Subtract the offset because it's negative for UTC+
      const nowInUserTz = new Date(nowUTC.getTime() - userTzOffset);
      
      // Get next occurrence (interpreted as if in user's timezone)
      // Use false (exclusive) to get NEXT occurrence, not current time
      const nextInUserTz = rule.after(nowInUserTz, false);
      
      if (!nextInUserTz) {
        return res.status(400).json({
          success: false,
          message: 'Invalid rrule: no future occurrences'
        });
      }
      
      // Convert back to actual UTC for storage
      // Add the offset back (it's negative for UTC+)
      nextRunAt = new Date(nextInUserTz.getTime() + userTzOffset);
      
      // Normalize to minute precision (HH:MM:00)
      nextRunAt = normalizeToMinute(nextRunAt);
      
      console.log(`🕐 Schedule calculation for timezone "${timezone}":`);
      console.log(`   Now (UTC): ${nowUTC.toISOString()}`);
      console.log(`   Now (${timezone}): ${new Date(nowUTC.getTime() - userTzOffset).toISOString().replace('Z', '')} ${timezone}`);
      console.log(`   Next run (${timezone}): ${new Date(nextRunAt.getTime() - userTzOffset).toISOString().replace('Z', '')} ${timezone}`);
      console.log(`   Next run (UTC, stored): ${nextRunAt.toISOString()}`);
      
    } catch (error) {
      console.error('RRule parsing error:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid rrule format'
      });
    }

    // Create schedule
    const scheduleData = {
      workspaceId,
      serverId: parseInt(serverId),
      name,
      action,
      rrule,
      timezone,
      nextRunAt,
      enabled: true
    };

    // Add instance type fields for scaling actions
    if (action === 'scale_down' || action === 'scale_up') {
      if (targetInstanceType) {
        scheduleData.targetInstanceType = targetInstanceType;
      }
      if (originalInstanceType) {
        scheduleData.originalInstanceType = originalInstanceType;
      }
      
      // Add volume fields if specified
      if (targetVolumeSize) scheduleData.targetVolumeSize = parseInt(targetVolumeSize);
      if (targetVolumeType) scheduleData.targetVolumeType = targetVolumeType;
      if (targetVolumeIops) scheduleData.targetVolumeIops = parseInt(targetVolumeIops);
      if (targetVolumeThroughput) scheduleData.targetVolumeThroughput = parseInt(targetVolumeThroughput);
      if (originalVolumeSize) scheduleData.originalVolumeSize = parseInt(originalVolumeSize);
      if (originalVolumeType) scheduleData.originalVolumeType = originalVolumeType;
      if (originalVolumeIops) scheduleData.originalVolumeIops = parseInt(originalVolumeIops);
      if (originalVolumeThroughput) scheduleData.originalVolumeThroughput = parseInt(originalVolumeThroughput);
    }

    const schedule = await prisma.schedule.create({
      data: scheduleData,
      include: {
        server: {
          select: {
            id: true,
            name: true,
            provider: true,
            instanceType: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule
    });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule'
    });
  }
});

/**
 * PUT /api/schedules/:id
 * Update a schedule
 */
router.put('/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const { name, action, rrule, timezone, enabled, targetInstanceType, originalInstanceType } = req.body;

    // Verify schedule belongs to workspace
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        workspaceId
      }
    });

    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (action !== undefined) {
      if (!['stop', 'start', 'reboot', 'scale_down', 'scale_up'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
      }
      updateData.action = action;
      
      // Validate instance type for scaling actions
      if ((action === 'scale_down' || action === 'scale_up') && targetInstanceType === undefined && !existingSchedule.targetInstanceType) {
        return res.status(400).json({
          success: false,
          message: 'targetInstanceType is required for scale_down and scale_up actions'
        });
      }
    }
    if (timezone !== undefined) updateData.timezone = timezone;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (targetInstanceType !== undefined) updateData.targetInstanceType = targetInstanceType;
    if (originalInstanceType !== undefined) updateData.originalInstanceType = originalInstanceType;

    // If rrule changed, recalculate next run
    if (rrule !== undefined) {
      try {
        const rule = RRule.fromString(rrule);
        const nowUTC = new Date();
        
        // Use the timezone from request, or fallback to existing schedule's timezone
        const scheduleTimezone = timezone !== undefined ? timezone : existingSchedule.timezone;
        
        // Get timezone offset and adjust calculation
        const userTzOffset = getTimezoneOffsetMs(scheduleTimezone, nowUTC);
        const nowInUserTz = new Date(nowUTC.getTime() - userTzOffset);
        // Use false (exclusive) to get NEXT occurrence
        const nextInUserTz = rule.after(nowInUserTz, false);
        
        if (!nextInUserTz) {
          return res.status(400).json({
            success: false,
            message: 'Invalid rrule: no future occurrences'
          });
        }
        
        // Convert back to UTC
        const nextRunAt = new Date(nextInUserTz.getTime() + userTzOffset);
        
        updateData.rrule = rrule;
        updateData.nextRunAt = normalizeToMinute(nextRunAt); // Normalize to HH:MM:00
        
        console.log(`🕐 Updated schedule ${scheduleId} for timezone "${scheduleTimezone}":`);
        console.log(`   Next run (UTC): ${updateData.nextRunAt.toISOString()}`);
        
      } catch (error) {
        console.error('RRule update error:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid rrule format'
        });
      }
    }

    // Update schedule
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        server: {
          select: {
            id: true,
            name: true,
            provider: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule'
    });
  }
});

/**
 * DELETE /api/schedules/:id
 * Delete a schedule
 */
router.delete('/:id', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    // Verify schedule belongs to workspace
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        workspaceId
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Delete schedule (executions will cascade delete)
    await prisma.schedule.delete({
      where: { id: scheduleId }
    });

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule'
    });
  }
});

/**
 * PUT /api/schedules/:id/toggle
 * Enable or disable a schedule
 */
router.put('/:id/toggle', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;

    // Verify schedule belongs to workspace
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        workspaceId
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Toggle enabled status
    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { enabled: !schedule.enabled }
    });

    res.json({
      success: true,
      message: `Schedule ${updated.enabled ? 'enabled' : 'disabled'} successfully`,
      data: updated
    });

  } catch (error) {
    console.error('Toggle schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle schedule'
    });
  }
});

/**
 * GET /api/schedules/:id/executions
 * Get execution history for a schedule
 */
router.get('/:id/executions', async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id);
    const workspaceId = req.user.workspaceId;
    const limit = parseInt(req.query.limit) || 50;

    // Verify schedule belongs to workspace
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        workspaceId
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    // Get executions
    const executions = await prisma.scheduleExecution.findMany({
      where: { scheduleId },
      orderBy: { executedAt: 'desc' },
      take: limit
    });

    res.json({
      success: true,
      data: executions
    });

  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get execution history'
    });
  }
});

export default router;

