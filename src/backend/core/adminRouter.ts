import express from 'express';
import { DB } from './db';
import { authenticateJWT, requireSuperAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticateJWT);
router.use(requireSuperAdmin);

router.get('/users', (req, res) => {
  res.json(DB.getAllUsers());
});

router.post('/set-subscription', (req, res) => {
  const { uid, plan, durationMonths } = req.body;
  if (!uid || !plan) return res.status(400).json({ error: "Missing data" });

  const startDate = new Date().toISOString();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + (durationMonths || 1));

  const user = DB.upsertUser({
    uid,
    email: '', // Not used for update if uid exists
    subscription: {
      plan,
      startDate,
      endDate: endDate.toISOString()
    }
  });

  res.json({ status: "success", user });
});

router.post('/create-guest', (req, res) => {
  const guestId = Math.random().toString(36).substr(2, 8);
  const email = `guest_${guestId}@autobuddy.pro`;
  const uid = `guest_${guestId}`;
  
  const endDate = new Date();
  endDate.setHours(endDate.getHours() + 24);

  const guest = DB.upsertUser({
    uid,
    email,
    role: 'guest',
    subscription: {
      plan: 'guest_24h',
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString()
    }
  });

  res.json({ 
    status: "success", 
    user: guest,
    credentials: {
      email,
      password: "Guest_Access_" + guestId // In a real app, we'd use regular auth, but this is for specific guest flow
    }
  });
});

router.post('/disable-user', (req, res) => {
  const { uid } = req.body;
  const user = DB.upsertUser({ uid, email: '', status: 'disabled' });
  res.json({ status: "success", user });
});

export default router;
