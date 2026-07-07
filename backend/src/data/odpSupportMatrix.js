/**
 * ODP Support Matrix
 * Data source: https://docs.acceldata.io/odp/support-matrix/support-matrix
 * Last updated: 2026-01-14
 */

export const odpSupportMatrix = {
  // Map of ODP versions to their compatible components
  compatibility: {
    '3.3.6.3-1': {
      ambari: ['3.0.0.0-1'],
      os: {
        'rhel': ['8', '9'],
        'rocky': ['8', '9'],
        'ubuntu': ['20', '22']
      },
      odpJdk: ['8', '11', '17'],
      ambariJdk: ['17'],
      python: ['3.9', '3.11'],
      database: {
        'mysql': ['5.7.x', '8.x'],
        'postgresql': ['9.6', '12', '15'],
        'mariadb': ['10.3', '10.11'],
        'oracle': ['12c', '19c']
      }
    },
    '3.3.6.2-102': {
      ambari: ['3.0.0.0-1'],
      os: {
        'rhel': ['8', '9'],
        'rocky': ['8', '9'],
        'ubuntu': ['20', '22']
      },
      odpJdk: ['8', '11', '17'],
      ambariJdk: ['17'],
      python: ['3.9', '3.11'],
      database: {
        'mysql': ['5.7.x', '8.x'],
        'postgresql': ['9.6', '12', '15'],
        'mariadb': ['10.3', '10.11'],
        'oracle': ['12c', '19c']
      }
    },
    '3.3.6.2-1': {
      ambari: ['2.7.9.2-1', '2.7.9.2-102', '3.0.0.0-1'],
      os: {
        'rhel': ['8', '9'],
        'rocky': ['8', '9'],
        'ubuntu': ['20', '22']
      },
      odpJdk: ['8', '11', '17'],
      ambariJdk: ['8', '11', '17'],
      python: ['3.9', '3.11'],
      database: {
        'mysql': ['5.7.x', '8.x'],
        'postgresql': ['9.6', '12', '15'],
        'mariadb': ['10.3', '10.11'],
        'oracle': ['12c', '19c']
      }
    },
    '3.3.6.1-1': {
      ambari: ['2.7.9.1-1', '2.7.9.2-1', '3.0.0.0-1'],
      os: {
        'rhel': ['8', '9'],
        'rocky': ['8', '9'],
        'ubuntu': ['20', '22']
      },
      odpJdk: ['8', '11', '17'],
      ambariJdk: ['8', '11', '17'],
      python: ['3.9', '3.11'],
      database: {
        'mysql': ['5.7.x', '8.x'],
        'postgresql': ['9.6', '12', '15'],
        'mariadb': ['10.3', '10.11'],
        'oracle': ['12c', '19c']
      }
    },
    '3.3.6.0-1': {
      ambari: ['2.7.9.0-1', '2.7.9.1-1'],
      os: {
        'rhel': ['8', '9'],
        'rocky': ['8', '9'],
        'ubuntu': ['20', '22']
      },
      odpJdk: ['8', '11'],
      ambariJdk: ['8', '11'],
      python: ['2', '3.9'],
      database: {
        'mysql': ['5.7.x', '8.x'],
        'postgresql': ['9.6', '12'],
        'mariadb': ['10.3'],
        'oracle': ['12c', '19c']
      }
    },
    '3.2.4.0-1': {
      ambari: ['2.7.8.3-3'],
      os: {
        'centos': ['7'],
        'rhel': ['8'],
        'rocky': ['8'],
        'ubuntu': ['20']
      },
      odpJdk: ['8', '11'],
      ambariJdk: ['8', '11'],
      python: ['2', '3.9'],
      database: {
        'mysql': ['5.7.x'],
        'postgresql': ['9.6', '12'],
        'mariadb': ['10.3'],
        'oracle': ['12c']
      }
    }
  },

  // All available versions
  odpVersions: [
    '3.3.6.3-1',
    '3.3.6.2-102',
    '3.3.6.2-1',
    '3.3.6.1-1',
    '3.3.6.0-1',
    '3.2.4.0-1',
    '3.2.3.4-3',
    '3.2.3.4-2',
    '3.2.3.3-2',
    '3.2.3.3-3',
    '3.2.3.2-3',
    '3.2.3.2-2',
    '3.2.3.1-3',
    '3.2.3.1-2',
    '3.2.3.0-3',
    '3.2.3.0-2',
    '3.2.3.0-1',
    '3.2.2.0-2',
    '3.2.2.0-1'
  ],

  ambariVersions: [
    '3.0.0.0-1',
    '2.7.9.2-102',
    '2.7.9.2-1',
    '2.7.9.1-1',
    '2.7.9.0-1',
    '2.7.8.3-3',
    '2.7.8.3-2',
    '2.7.8.2-2',
    '2.7.8.2-3',
    '2.7.8.1-1',
    '2.7.8.0-1',
    '2.7.6.1-1',
    '2.7.6.0-1',
    '2.7.6.0.0'
  ],

  operatingSystems: {
    'centos': { name: 'CentOS', versions: ['7'] },
    'rhel': { name: 'RHEL', versions: ['8', '9'] },
    'rocky': { name: 'Rocky Linux', versions: ['8', '9'] },
    'ubuntu': { name: 'Ubuntu', versions: ['20', '22'] }
  },

  javaVersions: {
    'odp': ['8', '11', '17'],
    'ambari': ['8', '11', '17']
  },

  pythonVersions: ['2', '3.9', '3.11'],

  databases: {
    'mysql': { name: 'MySQL', versions: ['5.7.x', '8.x'] },
    'postgresql': { name: 'PostgreSQL', versions: ['9.6', '12', '15'] },
    'mariadb': { name: 'MariaDB', versions: ['10.3', '10.11'] },
    'oracle': { name: 'Oracle', versions: ['12c', '19c'] }
  },

  // Repository URLs for different versions
  repositories: {
    'ambari': {
      '3.0.0.0-1': {
        'rhel9': 'https://mirror.odp.acceldata.dev/v2/ambari/python3/jdk17/3.0.0.0-1/releases/rhel9/',
        'rhel8': 'https://mirror.odp.acceldata.dev/v2/ambari/python3/jdk17/3.0.0.0-1/releases/rhel8/',
        'ubuntu20': 'https://mirror.odp.acceldata.dev/v2/ambari/python3/jdk17/3.0.0.0-1/releases/ubuntu20/',
        'ubuntu22': 'https://mirror.odp.acceldata.dev/v2/ambari/python3/jdk17/3.0.0.0-1/releases/ubuntu22/'
      },
      '2.7.9.2-1': {
        'rhel8': 'https://mirror.odp.acceldata.dev/ODP/rhel/Ambari-2.7.9.2-1/',
        'rhel9': 'https://mirror.odp.acceldata.dev/ODP/rhel/Ambari-2.7.9.2-1/',
        'ubuntu20': 'https://mirror.odp.acceldata.dev/ODP/ubuntu20/Ambari-2.7.9.2-1/'
      }
    },
    'odp': {
      '3.3.6.3-1': {
        'rhel8': 'https://mirror.odp.acceldata.dev/v2/odp/python3/jdk17/3.3.6.3-1/releases/rhel8/',
        'rhel9': 'https://mirror.odp.acceldata.dev/v2/odp/python3/jdk17/3.3.6.3-1/releases/rhel9/',
        'ubuntu20': 'https://mirror.odp.acceldata.dev/v2/odp/python3/jdk17/3.3.6.3-1/releases/ubuntu20/',
        'ubuntu22': 'https://mirror.odp.acceldata.dev/v2/odp/python3/jdk17/3.3.6.3-1/releases/ubuntu22/'
      }
    }
  },

  // Get compatible components for a specific ODP version
  getCompatibility: function(odpVersion) {
    return this.compatibility[odpVersion] || null;
  },

  // Check if a specific combination is compatible
  isCompatible: function(odpVersion, componentType, componentValue) {
    const compat = this.compatibility[odpVersion];
    if (!compat) return false;

    switch (componentType) {
      case 'ambari':
        return compat.ambari.includes(componentValue);
      case 'os':
        const [osType, osVersion] = componentValue.split(':');
        return compat.os[osType]?.includes(osVersion) || false;
      case 'odpJdk':
        return compat.odpJdk.includes(componentValue);
      case 'ambariJdk':
        return compat.ambariJdk.includes(componentValue);
      case 'python':
        return compat.python.includes(componentValue);
      case 'database':
        const [dbType, dbVersion] = componentValue.split(':');
        return compat.database[dbType]?.includes(dbVersion) || false;
      default:
        return false;
    }
  },

  // Get repository URL for a specific configuration
  getRepositoryUrl: function(type, version, os) {
    return this.repositories[type]?.[version]?.[os] || null;
  }
};
