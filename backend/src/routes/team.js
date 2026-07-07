import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// User Management Service URL
const USER_MGMT_URL = process.env.USER_MGMT_URL || 'http://user-management:8004';

/**
 * Proxy middleware to forward requests to user-management service
 */
async function proxyToUserManagement(req, res) {
  try {
    // Extract the path after /api/team
    const pathAfterTeam = req.originalUrl.replace('/api/team', '');
    
    const response = await axios({
      method: req.method,
      url: `${USER_MGMT_URL}/api${pathAfterTeam}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': req.user?.userId,
        'x-workspace-id': req.user?.workspaceId
      }
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Service unavailable' }
    );
  }
}

/**
 * GET /api/team/members
 * List workspace members (REQUIRES AUTH)
 */
router.get('/members', authenticate, async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: {
        workspaceId: req.user.workspaceId
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members'
    });
  }
});

/**
 * POST /api/team/invitations
 * Send invitation (REQUIRES AUTH - proxied to user-management service)
 */
router.post('/invitations', authenticate, proxyToUserManagement);

/**
 * GET /api/team/invitations
 * List invitations (REQUIRES AUTH - proxied to user-management service)
 */
router.get('/invitations', authenticate, proxyToUserManagement);

/**
 * DELETE /api/team/invitations/:id
 * Revoke invitation (REQUIRES AUTH - proxied to user-management service)
 */
router.delete('/invitations/:id', authenticate, proxyToUserManagement);

/**
 * GET /api/team/invitations/verify/:token (PUBLIC - no auth)
 * Verify invitation token
 */
router.get('/invitations/verify/:token', async (req, res) => {
  try {
    const response = await axios.get(
      `${USER_MGMT_URL}/api/invitations/verify/${req.params.token}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Failed to verify invitation' }
    );
  }
});

/**
 * POST /api/team/invitations/accept/:token (PUBLIC - no auth)
 * Accept invitation (not used - we use signup-invited instead)
 */
router.post('/invitations/accept/:token', async (req, res) => {
  try {
    const response = await axios.post(
      `${USER_MGMT_URL}/api/invitations/accept/${req.params.token}`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Failed to accept invitation' }
    );
  }
});

export default router;

