import { Router } from 'express';
import { dbStore } from '../db/store';

const router = Router();

// List users for demo quick-switch
router.get('/users', (req, res) => {
  res.json({ users: dbStore.getUsers() });
});

// Login
router.post('/login', (req, res) => {
  const { email, role } = req.body;
  const users = dbStore.getUsers();
  let user = users.find((u) => u.email === email);

  if (!user && role) {
    user = users.find((u) => u.role === role);
  }

  if (!user) {
    user = users[0]; // fallback to admin
  }

  res.json({
    success: true,
    user,
    token: `demo-jwt-token-${user.id}`,
  });
});

export default router;
