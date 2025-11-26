import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Get workspace statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;

    // Get counts for each resource type
    const [servers, containers, cloudAccounts] = await Promise.all([
      prisma.server.count({
        where: { workspaceId, status: 'running' }
      }),
      prisma.container.count({
        where: { workspaceId, status: 'running' }
      }),
      prisma.cloudAccount.count({
        where: { workspaceId, isActive: true }
      })
    ]);

    // Calculate monthly cost (placeholder - will integrate with cost APIs later)
    const monthlyCost = 0; // TODO: Calculate from cloud accounts

    res.json({
      success: true,
      data: {
        servers,
        containers,
        providers: cloudAccounts,
        monthlyCost
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * GET /api/dashboard/activity
 * Get recent activity/audit logs for workspace
 */
router.get('/activity', async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;

    const activities = await prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      action: formatActivityAction(activity),
      time: formatTimeAgo(activity.createdAt),
      user: activity.user?.fullName || 'System'
    }));

    res.json({
      success: true,
      data: formattedActivities
    });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
});

/**
 * Format activity action for display
 */
function formatActivityAction(activity) {
  const actionMap = {
    'workspace_created': 'Workspace created',
    'user_created': 'User added',
    'cloud_account_connected': 'Cloud account connected',
    'server_added': 'Server added',
    'container_started': 'Container started',
    'container_stopped': 'Container stopped'
  };

  return actionMap[activity.action] || activity.action;
}

/**
 * Format timestamp to "time ago" string
 */
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return new Date(date).toLocaleDateString();
}

export default router;

