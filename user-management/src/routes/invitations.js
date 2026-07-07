import express from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma.js';
import emailService from '../services/email.js';

const router = express.Router();

/**
 * Middleware to verify user authentication
 * (This assumes the request comes from backend with user info)
 */
function authenticate(req, res, next) {
  // In production, verify JWT or session
  // For now, we'll accept userId and workspaceId from headers
  const userId = req.headers['x-user-id'];
  const workspaceId = req.headers['x-workspace-id'];

  if (!userId || !workspaceId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  req.userId = parseInt(userId);
  req.workspaceId = parseInt(workspaceId);
  next();
}

/**
 * POST /api/invitations
 * Send workspace invitation
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const { workspaceId, userId } = req;

    // Validate input
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, member, or viewer'
      });
    }

    // Get workspace and inviter info
    const [workspace, inviter] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ]);

    if (!workspace || !inviter) {
      return res.status(404).json({
        success: false,
        message: 'Workspace or inviter not found'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Check if already a member
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          userId: existingUser.id,
          workspaceId
        }
      });

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this workspace'
        });
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'An invitation has already been sent to this email'
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email,
        token,
        role,
        invitedBy: userId,
        expiresAt,
        status: 'pending'
      }
    });

    // Send invitation email
    try {
      await emailService.sendInvitation({
        to: email,
        workspaceName: workspace.name,
        inviterName: inviter.fullName,
        inviteToken: token,
        role
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request, invitation is still created
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitation'
    });
  }
});

/**
 * GET /api/invitations
 * List workspace invitations
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req;
    const { status } = req.query;

    const where = { workspaceId };
    if (status) {
      where.status = status;
    }

    const invitations = await prisma.workspaceInvitation.findMany({
      where,
      include: {
        inviter: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: invitations
    });

  } catch (error) {
    console.error('List invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invitations'
    });
  }
});

/**
 * DELETE /api/invitations/:id
 * Revoke invitation
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id);
    const { workspaceId } = req;

    // Verify invitation belongs to workspace
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        id: invitationId,
        workspaceId
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only revoke pending invitations'
      });
    }

    // Update status to revoked
    await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { status: 'revoked' }
    });

    res.json({
      success: true,
      message: 'Invitation revoked successfully'
    });

  } catch (error) {
    console.error('Revoke invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke invitation'
    });
  }
});

/**
 * GET /api/invitations/verify/:token (PUBLIC)
 * Verify invitation token
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        },
        inviter: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation token'
      });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' }
      });

      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Invitation has already been accepted'
      });
    }

    // Check if revoked
    if (invitation.status === 'revoked') {
      return res.status(400).json({
        success: false,
        message: 'Invitation has been revoked'
      });
    }

    res.json({
      success: true,
      data: {
        email: invitation.email,
        workspaceName: invitation.workspace.name,
        inviterName: invitation.inviter.fullName,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify invitation'
    });
  }
});

/**
 * POST /api/invitations/accept/:token (PUBLIC)
 * Accept invitation (will be handled by main backend for account creation)
 * This endpoint just validates and returns invitation details
 */
router.post('/accept/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { userId } = req.body; // User ID after account creation/login

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token }
    });

    if (!invitation || invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired invitation'
      });
    }

    // Check if expired
    if (new Date() > invitation.expiresAt) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' }
      });

      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // Add user to workspace
    await prisma.workspaceMember.create({
      data: {
        userId: parseInt(userId),
        workspaceId: invitation.workspaceId,
        role: invitation.role
      }
    });

    // Mark invitation as accepted
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        workspaceId: invitation.workspaceId,
        role: invitation.role
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept invitation'
    });
  }
});

export default router;

