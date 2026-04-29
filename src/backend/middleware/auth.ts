import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'neural-bridge-secret-999';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin' | 'guest';
    status: 'active' | 'disabled';
    subscription: any;
  };
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    req.user = payload as any;
    
    if (req.user?.status === 'disabled') {
      return res.status(403).json({ error: "Account disabled" });
    }
    
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

export const requireSuperAdmin = requireRole(['super_admin']);
export const requireAdmin = requireRole(['admin', 'super_admin']);
