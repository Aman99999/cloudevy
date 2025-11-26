import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import prisma from '../config/prisma.js';
import { slugify } from '../utils/slugify.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user by email with workspace info
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        workspace: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token with workspace info
    const token = jwt.sign(
      { 
        userId: user.id,
        workspaceId: user.workspaceId,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'dev_jwt_secret_key_12345',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        workspace: {
          id: user.workspace.id,
          name: user.workspace.name,
          slug: user.workspace.slug
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        workspace: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        workspace: {
          id: user.workspace.id,
          name: user.workspace.name,
          slug: user.workspace.slug
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /api/auth/signup
 * Create new workspace and owner user (multi-tenant)
 */
router.post(
  '/signup',
  [
    body('workspaceName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Workspace name must be between 2 and 100 characters'),
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],
  async (req, res) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { workspaceName, fullName, email, password } = req.body;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      // Generate unique slug for workspace
      let slug = slugify(workspaceName);
      let counter = 1;
      
      // Check for slug uniqueness
      while (await prisma.workspace.findUnique({ where: { slug } })) {
        slug = `${slugify(workspaceName)}-${counter}`;
        counter++;
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Use Prisma transaction to create workspace, user, and audit log
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create workspace
        const workspace = await tx.workspace.create({
          data: {
            name: workspaceName,
            slug,
            subscriptionStatus: 'trial'
          }
        });

        // 2. Create owner user
        const user = await tx.user.create({
          data: {
            workspaceId: workspace.id,
            email: email.toLowerCase(),
            passwordHash,
            fullName,
            role: 'owner'
          }
        });

        // 3. Log the signup action
        await tx.auditLog.create({
          data: {
            workspaceId: workspace.id,
            userId: user.id,
            action: 'workspace_created',
            resourceType: 'workspace',
            details: JSON.stringify({ workspace_name: workspaceName, user_email: email })
          }
        });

        return { workspace, user };
      });

      const { workspace, user } = result;

      // Generate JWT token (for auto-login)
      const token = jwt.sign(
        {
          userId: user.id,
          workspaceId: workspace.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '7d' }
      );

      // Return success response
      res.status(201).json({
        success: true,
        message: 'Workspace created successfully',
        data: {
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            trialEndsAt: workspace.trialEndsAt
          },
          user: {
            id: user.id,
            name: user.fullName,
            email: user.email,
            role: user.role
          },
          token
        }
      });

    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          message: 'This email or workspace name is already taken'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create workspace. Please try again later.'
      });
    }
  }
);

export default router;

