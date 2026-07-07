import express from 'express';
import { odpSupportMatrix } from '../data/odpSupportMatrix.js';

const router = express.Router();

/**
 * GET /api/odp-matrix
 * Get the complete ODP support matrix
 */
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        odpVersions: odpSupportMatrix.odpVersions,
        ambariVersions: odpSupportMatrix.ambariVersions,
        operatingSystems: odpSupportMatrix.operatingSystems,
        javaVersions: odpSupportMatrix.javaVersions,
        pythonVersions: odpSupportMatrix.pythonVersions,
        databases: odpSupportMatrix.databases,
        compatibility: odpSupportMatrix.compatibility
      }
    });
  } catch (error) {
    console.error('Error fetching ODP matrix:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ODP support matrix'
    });
  }
});

/**
 * GET /api/odp-matrix/compatibility/:version
 * Get compatibility info for a specific ODP version
 */
router.get('/compatibility/:version', (req, res) => {
  try {
    const { version } = req.params;
    const compatibility = odpSupportMatrix.getCompatibility(version);

    if (!compatibility) {
      return res.status(404).json({
        success: false,
        message: `ODP version ${version} not found`
      });
    }

    res.json({
      success: true,
      data: {
        version,
        compatibility
      }
    });
  } catch (error) {
    console.error('Error fetching compatibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compatibility info'
    });
  }
});

/**
 * POST /api/odp-matrix/validate
 * Validate a specific configuration
 */
router.post('/validate', (req, res) => {
  try {
    const { odpVersion, ambariVersion, os, osVersion, odpJdk, ambariJdk, python } = req.body;

    const compatibility = odpSupportMatrix.getCompatibility(odpVersion);
    
    if (!compatibility) {
      return res.status(400).json({
        success: false,
        message: `Invalid ODP version: ${odpVersion}`
      });
    }

    const validation = {
      odpVersion: { value: odpVersion, valid: true },
      ambariVersion: {
        value: ambariVersion,
        valid: compatibility.ambari.includes(ambariVersion),
        supported: compatibility.ambari
      },
      os: {
        value: `${os}:${osVersion}`,
        valid: compatibility.os[os]?.includes(osVersion) || false,
        supported: compatibility.os
      },
      odpJdk: {
        value: odpJdk,
        valid: compatibility.odpJdk.includes(odpJdk),
        supported: compatibility.odpJdk
      },
      ambariJdk: {
        value: ambariJdk,
        valid: compatibility.ambariJdk.includes(ambariJdk),
        supported: compatibility.ambariJdk
      },
      python: {
        value: python,
        valid: compatibility.python.includes(python),
        supported: compatibility.python
      }
    };

    const allValid = Object.values(validation).every(v => v.valid);

    res.json({
      success: true,
      data: {
        valid: allValid,
        validation
      }
    });
  } catch (error) {
    console.error('Error validating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate configuration'
    });
  }
});

/**
 * GET /api/odp-matrix/repositories
 * Get repository URLs for a specific configuration
 */
router.get('/repositories', (req, res) => {
  try {
    const { odpVersion, ambariVersion, os, osVersion } = req.query;
    
    const osKey = `${os}${osVersion}`;
    
    const repositories = {
      odpUrl: odpSupportMatrix.getRepositoryUrl('odp', odpVersion, osKey),
      ambariUrl: odpSupportMatrix.getRepositoryUrl('ambari', ambariVersion, osKey)
    };

    res.json({
      success: true,
      data: repositories
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch repository URLs'
    });
  }
});

export default router;
