import express from 'express';
import { getAuth } from 'firebase-admin/auth';
import * as jose from 'jose';
import { DB } from './db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'neural-bridge-secret-999';

router.post('/exchange', async (req, res) => {
  const { firebase_token } = req.body;
  if (!firebase_token) return res.status(400).json({ error: "Missing token" });

  try {
    const decodedToken = await getAuth().verifyIdToken(firebase_token);
    const { uid, email } = decodedToken;
    
    if (!email) return res.status(400).json({ error: "Email is required for identity" });

    // Roles Logic
    const adminEmails = ['rubenlleg12@gmail.com', 'rubenllego12@gmail.com'];
    const role = adminEmails.includes(email.toLowerCase()) ? 'super_admin' : 'user';

    // Upsert user in our local DB
    const user = DB.upsertUser({
      uid,
      email,
      role: role as any
    });

    // Sign JWT
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT({ ...user })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(secret);

    res.json({ token, user });
  } catch (e: any) {
    console.error("[AUTH] Exchange error:", e.message);
    res.status(401).json({ error: "Invalid identity token" });
  }
});

export default router;
