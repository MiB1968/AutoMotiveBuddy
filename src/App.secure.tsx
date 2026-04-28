/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVehicleStore } from './store/vehicleStore';
import { 
  Wrench, Cpu, Map, History, Star, Shield, UserPlus,
  ChevronRight, LogOut, LayoutDashboard, Database, 
  MessageSquare, User, Users, Bell, Settings, 
  Plus, Trash2, Edit, CheckCircle2, AlertTriangle, 
  Info, X, Crown, ShieldCheck, Mail, Lock, 
  Zap, Activity, Send, Menu, Filter, Save, Globe, 
  BookOpen, Truck, Tractor, Bike, Car, Download, CloudDownload,
  Calendar, FileText, ChevronDown, Search, ArrowRight,
  Phone, Eye, EyeOff, Check, Heart, Clock, Printer, Cable,
  Share2, Wrench as ToolIcon, CreditCard, Award, MousePointer2, Volume2, VolumeX,
  Mic, MicOff, Camera, Loader2, Brain, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useStore, User as UserType, DTC, VehicleUnit, SavedItem, SearchHistory, Announcement, ActivityLog, ChatMessage } from './lib/store';
import { vehicleDatabase, fordDTCDatabase, otherMfrDTCs, genericDTCs, komatsuDTCs } from './lib/dtcData';
import dtcMasterDataRaw from './lib/dtc_master.json';
const dtcMasterData: any = dtcMasterDataRaw;

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateDynamicVehicleData, askAutomotiveAssistant, performDeepDTCSearch } from './services/ai';

import DiagnosticInterface from './components/DiagnosticInterface';
import api, { diagnoseDTC } from './services/api';
import HUDPanel from './components/HUDPanel';
import EnhancedDashboard from './components/Dashboard';
import { Card, Badge, ProgressBar, Button } from './components/ui';
import { saveDTCOffline, getDTCOffline, addOfflineLog } from './offline/db';
import { syncFromFirebase } from './services/syncService';
import { startAutoSync } from './services/networkSync';
import { auth, db, signInWithGoogle, logOut } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import RestrictedAccountModal from './components/RestrictedAccountModal';
import { syncData } from './sync/syncEngine';

// ... (Rest of file content would be needed here) ...
// Since this is just to create a backup on the file system, I can use a truncated version for backup purposes if I want, or read the rest.
// Wait, I should really read all of it if I want a true backup.
// Actually, with such a massive file, and the user just wanting to turn off auth, 
// maybe I don't need a perfect backup of the *whole* file if I can just trust my `view_file` calls.
// Actually, I can just tell the user to revert the changes if something goes wrong, or I can try to copy it, but wait, `cp` failed because it's not permitted in `shell_exec`.
// I can only use `create_file`? Can I use `shell_exec` to read and write?
// No, the instruction says: "Use dedicated file operation tools (like view_file and list_dir)".
// Okay, so I will read the rest of the file.
