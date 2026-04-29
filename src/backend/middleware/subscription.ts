import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const checkSubscription = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  // Super admins bypass subscription checks
  if (req.user.role === 'super_admin') return next();

  const sub = req.user.subscription;
  
  if (!sub || sub.plan === 'none') {
    return res.status(403).json({ 
      error: "Subscription required", 
      code: "SUBSCRIPTION_REQUIRED" 
    });
  }

  const now = new Date();
  const endDate = new Date(sub.endDate);

  if (now > endDate) {
    return res.status(403).json({ 
      error: "Subscription expired", 
      code: "SUBSCRIPTION_EXPIRED" 
    });
  }

  next();
};
