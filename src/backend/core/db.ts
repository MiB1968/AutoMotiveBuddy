import fs from 'fs';
import path from 'path';

export interface User {
  uid: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin' | 'guest';
  status: 'active' | 'disabled';
  subscription: {
    plan: '1_month' | '3_month' | '6_month' | '1_year' | 'guest_24h' | 'none';
    startDate: string;
    endDate: string;
  } | null;
  createdAt: string;
}

const DB_PATH = path.join(process.cwd(), 'data/users.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

export class DB {
  private static users: User[] = [];

  static load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        this.users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      } else {
        this.users = [];
        this.save();
      }
    } catch (e) {
      console.error("DB Load Error:", e);
      this.users = [];
    }
  }

  static save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.users, null, 2));
    } catch (e) {
      console.error("DB Save Error:", e);
    }
  }

  static findUserByUid(uid: string) {
    return this.users.find(u => u.uid === uid);
  }

  static findUserByEmail(email: string) {
    return this.users.find(u => u.email === email);
  }

  static upsertUser(userData: Partial<User> & { uid: string; email: string }) {
    const existingIndex = this.users.findIndex(u => u.uid === userData.uid);
    if (existingIndex > -1) {
      this.users[existingIndex] = { ...this.users[existingIndex], ...userData };
      this.save();
      return this.users[existingIndex];
    } else {
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + 24);

      const newUser: User = {
        uid: userData.uid,
        email: userData.email,
        role: userData.role || 'user',
        status: userData.status || 'active',
        subscription: userData.subscription || {
          plan: 'guest_24h',
          startDate: new Date().toISOString(),
          endDate: endDate.toISOString()
        },
        createdAt: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.save();
      return newUser;
    }
  }

  static getAllUsers() {
    return this.users;
  }

  static deleteUser(uid: string) {
    this.users = this.users.filter(u => u.uid !== uid);
    this.save();
  }
}

DB.load();
