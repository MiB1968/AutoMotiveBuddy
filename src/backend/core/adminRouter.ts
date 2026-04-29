import express from 'express';
import * as userService from '../services/userService';
import { authenticateJWT, requireSuperAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticateJWT);
router.use(requireSuperAdmin);

// List all system users
router.get('/users', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: "Failed to retrieve operative registry" });
  }
});

// Set subscription manually
router.post('/set-subscription', async (req, res) => {
  const { uid, plan, durationMonths } = req.body;
  if (!uid || !plan) return res.status(400).json({ error: "Missing identity or plan protocol" });

  try {
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (durationMonths || 1));

    await userService.updateUser(uid, {
      subscription: {
        plan,
        startDate,
        endDate: endDate.toISOString(),
        active: true
      }
    });

    res.json({ status: "success", message: "Subscription override successful" });
  } catch (e) {
    res.status(500).json({ error: "Subscription mutation failed" });
  }
});

// Account lockdown
router.post('/lockdown', async (req, res) => {
  const { uid, status } = req.body; // status: 'active' | 'disabled'
  if (!uid) return res.status(400).json({ error: "Missing UID" });

  try {
    await userService.updateUser(uid, { status });
    res.json({ status: "success", message: `Node status set to ${status}` });
  } catch (e) {
    res.status(500).json({ error: "Lockdown protocol failed" });
  }
});

// Remove node
router.delete('/user/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    await userService.deleteUser(uid);
    res.json({ status: "success", message: "Node purged from system" });
  } catch (e) {
    res.status(500).json({ error: "Purge failed" });
  }
});

export default router;
