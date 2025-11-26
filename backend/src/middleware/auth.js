import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_key_12345');
    
    // Attach user info from JWT to request
    req.user = {
      userId: decoded.userId,
      workspaceId: decoded.workspaceId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    const roleHierarchy = {
      owner: 3,
      admin: 2,
      viewer: 1
    };

    const userLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = Math.min(...allowedRoles.map(role => roleHierarchy[role] || 999));

    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

