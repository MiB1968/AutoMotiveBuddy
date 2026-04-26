import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Users, FileText, Database, Shield, Zap, Terminal } from 'lucide-react';
import { Card, Badge, ProgressBar } from './ui';

export const EnhancedDashboard = ({ user, store, stats }: any) => {
  const isAdmin = user?.role === 'admin';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Cards */}
        <Card className="p-4 flex flex-col gap-2 hover:border-orange-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
              <Users size={20} />
            </div>
            {isAdmin && <Badge variant="success">+12%</Badge>}
          </div>
          <div className="mt-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{isAdmin ? "Active Members" : "Total Lookups"}</p>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">{isAdmin ? "1,284" : "1,248"}</h3>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-2 hover:border-blue-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Activity size={20} />
            </div>
            {isAdmin && <Badge variant="warning">3 Pending</Badge>}
          </div>
          <div className="mt-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{isAdmin ? "Active Sessions" : "Saved Codes"}</p>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">{isAdmin ? "42" : "34"}</h3>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-2 hover:border-purple-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Zap size={20} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">AI Queries</p>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">{isAdmin ? "42.5k" : "89"}</h3>
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-2 hover:border-emerald-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Database size={20} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">System Status</p>
            <h3 className="text-xl font-bold font-mono text-emerald-400 mt-1 uppercase">Optimal</h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs / Recent Activity */}
        <Card className="p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
            <Terminal size={18} className="text-orange-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Recent System Telemetry</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
             {store?.logs?.slice(0, 6).map((l: any) => (
                <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 gap-2">
                   <div>
                     <div className="text-xs font-bold text-orange-400 uppercase tracking-widest">{l.action}</div>
                     <div className="text-xs text-slate-300 mt-0.5">{l.details}</div>
                   </div>
                   <div className="text-xs font-mono text-slate-500 whitespace-nowrap">
                     {new Date(l.timestamp).toLocaleTimeString()}
                   </div>
                </div>
             ))}
             {(!store?.logs || store.logs.length === 0) && (
               <div className="py-8 text-center text-sm text-slate-500 font-mono">No telemetry data available</div>
             )}
          </div>
        </Card>

        {/* Security / System Info */}
        <Card className="p-6 flex flex-col">
           <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
            <Shield size={18} className="text-blue-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Security Posture</h3>
          </div>
          <div className="space-y-6 flex-1">
             <div>
               <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                 <span>Encryption Factor</span>
                 <span className="text-blue-400">92%</span>
               </div>
               <ProgressBar progress={92} className="h-1.5" />
             </div>
             <div>
               <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                 <span>Network Integrity</span>
                 <span className="text-emerald-400">100%</span>
               </div>
               <ProgressBar progress={100} className="h-1.5 bg-slate-800 [&>div]:bg-emerald-500" />
             </div>
             
             <div className="pt-4 border-t border-white/10 mt-auto">
               <div className="text-[10px] font-mono text-slate-500 uppercase">Neural Key</div>
               <div className="text-xs font-mono text-orange-400 truncate mt-1 bg-black/30 p-2 rounded border border-white/5 select-all">
                 {user?.id || 'AUTH_REQUIRED'}
               </div>
             </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default EnhancedDashboard;
