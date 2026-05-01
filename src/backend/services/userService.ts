import { firestore } from '../../../server';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  status: 'active' | 'disabled';
  subscription: {
    plan: string;
    startDate: string;
    endDate: string;
    active: boolean;
  };
  createdAt: string;
  avatarUrl?: string;
}

export async function getOrCreateUser(uid: string, email: string): Promise<UserProfile> {
  if (!firestore) {
    console.error("[USER SERVICE] Firestore not initialized");
    throw new Error("Database Service Unavailable");
  }

  const normalizedEmail = (email || '').toLowerCase().trim();
  const now = new Date();
  console.log(`[USER SERVICE] getOrCreateUser probe for: ${normalizedEmail} [${uid}]`);

  const userDoc = await firestore.collection('users').doc(uid).get();

  if (userDoc.exists) {
    const data = userDoc.data() as UserProfile;
    const superAdmins = ['rubenlleg12@gmail.com', 'rubenllego12@gmail.com', 'rubenllego@autobuddy.pro'];
    let needsUpdate = false;
    
    console.log(`[USER SERVICE] Found existing record for ${normalizedEmail}. Current Role: ${data.role}`);

    // AUTO-UPGRADE: Ensure whitelisted admins have correct roles
    if (superAdmins.includes(normalizedEmail) && data.role !== 'super_admin') {
      console.log(`[USER SERVICE] Promoting ${normalizedEmail} to Super Admin via Auto-Upgrade`);
      data.role = 'super_admin';
      data.subscription = {
        plan: 'lifetime_pro',
        startDate: data.subscription?.startDate || now.toISOString(),
        endDate: new Date(2099, 11, 31).toISOString(),
        active: true
      };
      needsUpdate = true;
    }

    // AUTO-HEAL: Ensure subscription integrity for legacy or corrupted records
    if (!data.subscription || !data.subscription.plan) {
      console.warn(`[USER SERVICE] Self-healing user record subscription: ${normalizedEmail}`);
      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setHours(trialEnd.getHours() + 24);
      
      data.subscription = {
        plan: 'trial_24h',
        startDate: now.toISOString(),
        endDate: trialEnd.toISOString(),
        active: true
      };
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      console.log(`[USER SERVICE] Committing self-healed/upgraded record for ${normalizedEmail}`);
      await firestore.collection('users').doc(uid).update({ 
        role: data.role,
        subscription: data.subscription 
      });
    }
    
    return data;
  }

  console.log(`[USER SERVICE] Creating new record for ${normalizedEmail}`);
  // AUTO RECOVERY TRIAL (NEVER BLOCK LOGIN)
  const trialEnd = new Date();
  trialEnd.setHours(trialEnd.getHours() + 24);

  const newUser: UserProfile = {
    uid,
    email: normalizedEmail,
    role: 'user', // Default
    status: 'active',
    subscription: {
      plan: 'trial_24h',
      startDate: now.toISOString(),
      endDate: trialEnd.toISOString(),
      active: true
    },
    createdAt: now.toISOString()
  };

  // Hardcode Super Admin if needed
  const superAdmins = ['rubenlleg12@gmail.com', 'rubenllego12@gmail.com', 'rubenllego@autobuddy.pro'];
  if (superAdmins.includes(normalizedEmail)) {
    console.log(`[USER SERVICE] Assigning Super Admin role to new record: ${normalizedEmail}`);
    newUser.role = 'super_admin';
    newUser.subscription.plan = 'lifetime_pro';
    newUser.subscription.endDate = new Date(2099, 11, 31).toISOString();
  }

  await firestore.collection('users').doc(uid).set(newUser);
  console.log(`[USER SERVICE] Auto-provisioned user ${normalizedEmail} successfully`);
  
  return newUser;
}

export async function updateUser(uid: string, data: Partial<UserProfile>) {
  if (!firestore) return;
  await firestore.collection('users').doc(uid).set(data, { merge: true });
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (!firestore) return [];
  const snapshot = await firestore.collection('users').get();
  const users: UserProfile[] = [];
  snapshot.forEach((doc: any) => users.push(doc.data() as UserProfile));
  return users;
}

export async function deleteUser(uid: string) {
  if (!firestore) return;
  await firestore.collection('users').doc(uid).delete();
}
