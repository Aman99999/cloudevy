import bcrypt from 'bcryptjs';

// Hardcoded users for development
// In production, move to database
export const HARDCODED_USERS = [
  {
    id: '1',
    username: 'admin',
    password: bcrypt.hashSync('admin123', 10),
    role: 'super_admin',
    name: 'Admin User'
  },
  {
    id: '2',
    username: 'manager',
    password: bcrypt.hashSync('manager123', 10),
    role: 'admin',
    name: 'Manager User'
  },
  {
    id: '3',
    username: 'user',
    password: bcrypt.hashSync('user123', 10),
    role: 'viewer',
    name: 'Viewer User'
  }
];

export const findUserByUsername = (username) => {
  return HARDCODED_USERS.find(u => u.username === username);
};

export const findUserById = (id) => {
  return HARDCODED_USERS.find(u => u.id === id);
};

