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

  const userDoc = await firestore.collection('users').doc(uid).get();

  if (userDoc.exists) {
    const data = userDoc.data() as UserProfile;
    
    // AUTO-HEAL: Ensure subscription integrity for legacy or corrupted records
    if (!data.subscription || !data.subscription.plan) {
      console.warn(`[USER SERVICE] Self-healing user record: ${email}`);
      const now = new Date();
      const trialEnd = new Date();
      trialEnd.setHours(trialEnd.getHours() + 24);
      
      data.subscription = {
        plan: 'trial_24h',
        startDate: now.toISOString(),
        endDate: trialEnd.toISOString(),
        active: true
      };
      
      // Update DB asynchronously to avoid blocking login if healing succeeds in memory
      firestore.collection('users').doc(uid).update({ subscription: data.subscription }).catch(console.error);
    }
    
    return data;
  }

  // AUTO RECOVERY TRIAL (NEVER BLOCK LOGIN)
  const now = new Date();
  const trialEnd = new Date();
  trialEnd.setHours(trialEnd.getHours() + 24);

  const newUser: UserProfile = {
    uid,
    email,
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

  // Hardcode Super Admin if needed (matching prompts)
  const superAdmins = ['rubenlleg12@gmail.com', 'rubenllego12@gmail.com'];
  if (superAdmins.includes(email.toLowerCase())) {
    newUser.role = 'super_admin';
    newUser.subscription.plan = 'lifetime_pro';
    newUser.subscription.endDate = new Date(2099, 11, 31).toISOString();
  }

  await firestore.collection('users').doc(uid).set(newUser);
  console.log(`[USER SERVICE] Auto-provisioned user ${email}`);
  
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
