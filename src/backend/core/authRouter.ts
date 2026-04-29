import { Router } from "express";
import { getAuth } from "firebase-admin/auth";
import * as jose from "jose";
import { getOrCreateUser } from "../services/userService";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'neural-bridge-secret-999';
const secret = new TextEncoder().encode(JWT_SECRET);

router.post("/exchange", async (req, res) => {
  const { firebase_token } = req.body;
  if (!firebase_token) return res.status(400).json({ error: "Missing identity token" });

  try {
    // 1. Verify Identity
    const decodedToken = await getAuth().verifyIdToken(firebase_token);
    const { uid, email } = decodedToken;
    
    if (!email) {
      console.error("[AUTH] Token missing email for UID:", uid);
      return res.status(400).json({ error: "Email verified identity required" });
    }

    // 2. Fetch or Sync User (Auto-Recovery System to ensure ZERO login failure)
    const user = await getOrCreateUser(uid, email);

    // 3. Issue Production JWT (Single Authority)
    const token = await new jose.SignJWT({ 
        uid: user.uid, 
        email: user.email, 
        role: user.role,
        subscription: user.subscription?.plan || 'trial_24h'
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('72h') 
      .sign(secret);

    console.log(`[AUTH] Neural Link Established: ${email} [${user.role}]`);
    res.json({ token, user });
  } catch (e: any) {
    console.error("[AUTH] Exchange Critical Failure:", e.message);
    res.status(401).json({ 
        error: "Identity Exchange Failed", 
        message: e.message,
        recovery_hint: "Ensure FIREBASE_CONFIG is set and browser allows connectivity"
    });
  }
});

export default router;
