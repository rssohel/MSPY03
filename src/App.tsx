import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Battery, 
  Wifi, 
  ShieldAlert, 
  Phone, 
  MessageSquare, 
  Compass, 
  Chrome, 
  Lock, 
  Unlock, 
  Sparkles, 
  RefreshCw, 
  Sliders, 
  Eye, 
  Skull, 
  MapPin, 
  Activity, 
  FileText, 
  Plus, 
  Trash, 
  Download, 
  Search, 
  Share2, 
  LogOut, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Settings,
  Heart,
  Smile,
  Ghost,
  Volume2,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import { MonitoringState, SecurityAlert, CallLog, MessageLog, BrowserHistoryItem, KeyloggerEvent, Geofence, AppBlockState, BlockedWebsite, AiReport } from './types';
import PhoneSimulator from './components/PhoneSimulator';

export default function App() {
  const [state, setState] = useState<MonitoringState | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calls' | 'messages' | 'gps' | 'keylogger' | 'blocking' | 'screenshots' | 'ai_report'>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Tab states
  const [selectedMessagePlatform, setSelectedMessagePlatform] = useState<'sms' | 'whatsapp' | 'snapchat' | 'instagram' | 'tinder'>('sms');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Geofence form state
  const [fenceName, setFenceName] = useState('');
  const [fenceRadius, setFenceRadius] = useState('200');
  const [fenceLat, setFenceLat] = useState('40.7128');
  const [fenceLng, setFenceLng] = useState('-74.0060');
  const [fenceType, setFenceType] = useState<'safe' | 'restricted'>('safe');

  // Block website form state
  const [blockUrl, setBlockUrl] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // Audio recording playback simulation state
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);

  // Gemini AI Analysis State
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Audio player interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playingCallId) {
      interval = setInterval(() => {
        setAudioPlaybackProgress(prev => {
          if (prev >= 100) {
            setPlayingCallId(null);
            return 0;
          }
          return prev + 8;
        });
      }, 500);
    } else {
      setAudioPlaybackProgress(0);
    }
    return () => clearInterval(interval);
  }, [playingCallId]);

  // Fetch complete state from backend API
  const fetchState = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
        setConnectionError(null);
      } else {
        throw new Error(`Server returned status: ${res.status}`);
      }
    } catch (err) {
      console.error('Error fetching state from mSpy server:', err);
      if (!state) {
        setConnectionError('Unable to connect to the mSpy monitoring server. The server might be booting up.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    let retryTimeout: NodeJS.Timeout;

    const attemptFetch = async (retriesLeft = 6) => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setState(data);
            setConnectionError(null);
            setLoading(false);
          }
        } else {
          throw new Error(`Server returned status ${res.status}`);
        }
      } catch (err) {
        console.error('mSpy secure server handshake attempt failed:', err);
        if (active) {
          if (retriesLeft > 0) {
            retryTimeout = setTimeout(() => {
              attemptFetch(retriesLeft - 1);
            }, 1500);
          } else {
            setConnectionError('Failed to establish connection with mSpy secure server. Please verify that the server is running on port 3000.');
            setLoading(false);
          }
        }
      }
    };

    attemptFetch();

    return () => {
      active = false;
      clearTimeout(retryTimeout);
    };
  }, []);

  // Force sync simulation
  const handleForceSync = async () => {
    setSyncing(true);
    // Add real-world vibration/loading feel
    await new Promise(resolve => setTimeout(resolve, 1500));
    await fetchState(true);
    setSyncing(false);
  };

  // Acknowledge custom safety alerts
  const handleAckAlert = async (id: string) => {
    try {
      const res = await fetch('/api/state/alerts/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const updated = await res.json();
        if (state) {
          setState({
            ...state,
            alerts: updated.alerts
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle App Block rules immediately synced with emulator
  const handleToggleBlockApp = async (appName: string, currentBlockState: boolean) => {
    try {
      const res = await fetch('/api/state/block-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, isBlocked: !currentBlockState })
      });
      if (res.ok) {
        const updated = await res.json();
        if (state) {
          setState({
            ...state,
            blockedApps: updated.blockedApps
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add website block rule
  const handleAddBlockSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockUrl.trim()) return;
    try {
      const res = await fetch('/api/state/block-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blockUrl, reason: blockReason || 'Restricted Category' })
      });
      if (res.ok) {
        const updated = await res.json();
        if (state) {
          setState({
            ...state,
            blockedSites: updated.blockedSites
          });
        }
        setBlockUrl('');
        setBlockReason('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete website block rule
  const handleDeleteBlockSite = async (id: string) => {
    try {
      const res = await fetch(`/api/state/block-site/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updated = await res.json();
        if (state) {
          setState({
            ...state,
            blockedSites: updated.blockedSites
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create new Geofence
  const handleAddGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fenceName.trim()) return;
    try {
      const res = await fetch('/api/state/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fenceName,
          radius: fenceRadius,
          latitude: fenceLat,
          longitude: fenceLng,
          type: fenceType
        })
      });
      if (res.ok) {
        const updated = await res.json();
        if (state) {
          setState({
            ...state,
            geofences: updated.geofences
          });
        }
        setFenceName('');
        setFenceRadius('200');
        setFenceLat('40.7128');
        setFenceLng('-74.0060');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete geofence
  const handleDeleteGeofence = async (id: string) => {
    try {
      const res = await fetch(`/api/state/geofences/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updated = await res.json();
        if (state) {
          setState({
            ...state,
            geofences: updated.geofences
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger server-side Gemini AI report generation
  const handleRunAiAnalysis = async () => {
    setAiLoading(true);
    setAiReport(null);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data);
        setActiveTab('ai_report');
      }
    } catch (err) {
      console.error('Gemini call failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Reset simulated log data
  const handleResetLogs = async () => {
    if (!confirm('Are you sure you want to reset all tracked log history to fresh state?')) return;
    try {
      const res = await fetch('/api/state/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        setAiReport(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (connectionError && !state) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-300 flex flex-col items-center justify-center font-sans p-6">
        <div className="max-w-md w-full bg-[#121214] border border-[#27272A] rounded-2xl p-6 text-center shadow-xl">
          <div className="w-12 h-12 bg-red-950/40 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold font-display text-white">Telemetry Handshake Offline</h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            {connectionError}
          </p>
          <p className="text-[11px] text-zinc-500 mt-3 bg-[#1C1C1F] p-2 rounded-lg font-mono">
            Check if backend processes are booted and if port 3000 is accessible.
          </p>
          <button
            onClick={() => fetchState(false)}
            className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Secure Handshake
          </button>
        </div>
      </div>
    );
  }

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-[#09090B] text-zinc-300 flex flex-col items-center justify-center font-sans gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-emerald-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold font-display text-white">mSpy Secure Server</h2>
          <p className="text-xs text-zinc-500 mt-1">Establishing high-grade telemetry handshake...</p>
        </div>
      </div>
    );
  }

  // Derived variables for quick summary metrics
  const activeAlerts = state.alerts.filter(a => !a.acknowledged);
  const highSeverityAlertsCount = activeAlerts.filter(a => a.severity === 'high').length;
  const blockedAppsCount = state.blockedApps.filter(a => a.isBlocked).length;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7] font-sans flex flex-col md:flex-row h-screen overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION - Styled to match "Elegant Dark" mockup theme */}
      <aside className="w-full md:w-64 bg-[#121214] border-b md:border-b-0 md:border-r border-[#27272A] flex flex-col shrink-0">
        
        {/* Sidebar Brand Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-[#09090B] rounded-full"></div>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white font-display">mSpy Pro</span>
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Control Panel</span>
            </div>
          </div>
          
          {/* Force manual reload trigger */}
          <button 
            onClick={handleForceSync}
            disabled={syncing}
            className={`p-1.5 bg-[#1C1C1F] hover:bg-zinc-800 border border-[#27272A] rounded-lg transition-all ${syncing ? 'opacity-50' : ''}`}
            title="Manual Handshake"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Navigation Tabs list */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2">
          
          {/* Tab Button Component helper */}
          {[
            { id: 'dashboard', label: 'Dashboard Overview', icon: Activity },
            { id: 'calls', label: 'Call Logs & Audio', icon: Phone, badge: state.calls.length },
            { id: 'messages', label: 'Chats & Messages', icon: MessageSquare, badge: state.messages.length },
            { id: 'gps', label: 'GPS & Geofencing', icon: MapPin },
            { id: 'keylogger', label: 'Keylogger Timeline', icon: FileText, badge: state.keylogger.length },
            { id: 'blocking', label: 'App & Site Blocks', icon: Sliders, badge: blockedAppsCount },
            { id: 'screenshots', label: 'Screen Captures', icon: Eye, badge: state.screenshots.length },
            { id: 'ai_report', label: 'Gemini Safety Report', icon: Sparkles, highlight: true }
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full px-3.5 py-2.5 rounded-lg flex items-center justify-between text-left transition-all ${
                  isActive 
                    ? item.highlight 
                      ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300' 
                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`w-4 h-4 ${isActive ? (item.highlight ? 'text-purple-400' : 'text-emerald-400') : 'text-zinc-500'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && !aiReport && !aiLoading && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                )}
              </button>
            );
          })}

          {/* AI Trigger Shortcut Block */}
          <div className="mt-6 pt-6 border-t border-[#27272A]">
            <button 
              onClick={handleRunAiAnalysis}
              disabled={aiLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all"
            >
              {aiLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing Activity...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Analyze Logs with Gemini
                </>
              )}
            </button>
          </div>
        </nav>

        {/* Target Device Status Card inside Sidebar */}
        <div className="p-4 border-t border-[#27272A] bg-[#0c0c0e]">
          <div className="bg-[#1C1C1F] p-3.5 rounded-lg border border-[#27272A]/40">
            <div className="text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-wider mb-1.5">Target Device</div>
            <div className="text-sm font-medium text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              {state.deviceInfo?.model || 'Samsung S24 Ultra'}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">{state.deviceInfo?.os}</p>
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-800/50">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] text-emerald-400 font-mono">Syncing Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#09090B]">
        
        {/* Top Header Metrics bar */}
        <header className="h-16 border-b border-[#27272A] flex items-center justify-between px-8 bg-[#09090B] shrink-0 overflow-x-auto select-none gap-4">
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-xs text-zinc-400 font-mono">
              Last Handshake: <span className="text-white font-sans">{new Date(state.deviceInfo?.lastUpdated).toLocaleTimeString()}</span>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
              Battery: <span className="text-emerald-400 font-sans font-bold flex items-center gap-0.5"><Battery className="w-3 h-3 inline text-emerald-400" /> {state.deviceInfo?.battery || 84}%</span>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
              Network: <span className="text-white font-sans flex items-center gap-0.5"><Wifi className="w-3 h-3 text-emerald-400" /> {state.deviceInfo?.network || 'Verizon 5G'}</span>
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              Storage: <span className="text-white font-sans font-medium">{state.deviceInfo?.storageUsed.toFixed(1)}GB / {state.deviceInfo?.storageTotal.toFixed(0)}GB</span>
            </div>
          </div>
          
          <div className="flex gap-2.5 shrink-0">
            <button 
              onClick={handleResetLogs}
              className="px-3 py-1.5 bg-[#1C1C1F] border border-red-950/40 hover:border-red-500/20 text-red-400 hover:bg-red-950/10 rounded text-xs transition-all flex items-center gap-1.5"
            >
              <Skull className="w-3.5 h-3.5" />
              Reset Logs
            </button>
            <button 
              onClick={handleForceSync}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold tracking-tight transition-all shadow-md shadow-emerald-950/20"
            >
              Force Sync Device
            </button>
          </div>
        </header>

        {/* Dynamic Inner Tab Content Grid with sidebar phone emulator */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden relative">
          
          {/* Main Panel Column (Scrollable dashboard) */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            
            {/* Quick Warning System Banner (if active alerts) */}
            {activeAlerts.length > 0 && (
              <div className="mb-6 bg-red-950/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3.5 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-300">Action Required: {activeAlerts.length} Unresolved Safety Alerts</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Target device entered a restricted sector or generated high-threat search keywords. Review warnings instantly in the panel.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    // Quick clear
                    state.alerts.forEach(a => handleAckAlert(a.id));
                  }}
                  className="text-xs text-red-400 underline hover:text-red-300 font-medium shrink-0"
                >
                  Dismiss All
                </button>
              </div>
            )}

            {/* TAB CONTENT: 1. DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Visual Title Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold font-display text-white tracking-tight">Parental Supervision Dashboard</h1>
                    <p className="text-xs text-zinc-400 mt-1">Real-time smartphone observation, block settings, and geofence tracking.</p>
                  </div>
                  <div className="text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>UTC: 2026-07-04</span>
                  </div>
                </div>

                {/* KPI Metrics row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#121214] border border-[#27272A] p-4 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">High Risks Detected</span>
                    <div className="text-2xl font-bold font-mono mt-1 text-red-500">{highSeverityAlertsCount}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">Requires focus discussion</div>
                  </div>
                  <div className="bg-[#121214] border border-[#27272A] p-4 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">SMS & Social Logs</span>
                    <div className="text-2xl font-bold font-mono mt-1 text-emerald-400">{state.messages.length}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">Tracked chat packets</div>
                  </div>
                  <div className="bg-[#121214] border border-[#27272A] p-4 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Keystrokes Captured</span>
                    <div className="text-2xl font-bold font-mono mt-1 text-cyan-400">{state.keylogger.length}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">Active typing interceptor</div>
                  </div>
                  <div className="bg-[#121214] border border-[#27272A] p-4 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Protected Zones</span>
                    <div className="text-2xl font-bold font-mono mt-1 text-purple-400">{state.geofences.length}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">Virtual sector geofences</div>
                  </div>
                </div>

                {/* Core Bento Grid (Matches mockup structure) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Map / Radar Sweep Simulator */}
                  <div className="lg:col-span-8 bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden h-[340px] flex flex-col">
                    <div className="p-4 flex items-center justify-between border-b border-[#27272A] select-none">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                        <h3 className="text-sm font-semibold text-white font-display">Live Vector Tracking Radar</h3>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">RADIUS: 1000M METRIC</span>
                    </div>
                    
                    <div className="flex-1 relative bg-[#09090b] flex items-center justify-center overflow-hidden radar-grid">
                      
                      {/* Radar sweep line */}
                      <div className="absolute w-[200%] h-[200%] bg-gradient-to-tr from-cyan-500/5 to-transparent origin-center rounded-full animate-spin-slow pointer-events-none"></div>

                      {/* Map concentric circles */}
                      <div className="absolute w-24 h-24 border border-cyan-500/10 rounded-full"></div>
                      <div className="absolute w-48 h-48 border border-cyan-500/5 rounded-full"></div>
                      <div className="absolute w-72 h-72 border border-cyan-500/5 rounded-full"></div>

                      {/* Render geofenced sectors directly on simulated vector grid */}
                      {state.geofences.map((fence) => {
                        // Place geofences near center based on coordinates relative to home
                        const relativeX = (fence.longitude - (-74.0060)) * 5000;
                        const relativeY = (fence.latitude - 40.7128) * 5000;
                        return (
                          <div 
                            key={fence.id}
                            className={`absolute rounded-full border flex items-center justify-center transition-all ${
                              fence.type === 'safe' 
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                                : 'bg-red-500/5 border-red-500/20 text-red-400'
                            }`}
                            style={{
                              width: `${fence.radius / 2}px`,
                              height: `${fence.radius / 2}px`,
                              transform: `translate(${relativeX}px, ${-relativeY}px)`
                            }}
                          >
                            <span className="text-[8px] font-mono select-none pointer-events-none tracking-tight">{fence.name}</span>
                          </div>
                        );
                      })}

                      {/* Target device dot flashing */}
                      {state.deviceInfo && (() => {
                        const relX = (state.deviceInfo.gpsLongitude - (-74.0060)) * 5000;
                        const relY = (state.deviceInfo.gpsLatitude - 40.7128) * 5000;
                        return (
                          <div 
                            className="absolute z-20 flex flex-col items-center group transition-all duration-700"
                            style={{
                              transform: `translate(${relX}px, ${-relY}px)`
                            }}
                          >
                            <span className="relative flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-white shadow-md"></span>
                            </span>
                            <div className="bg-slate-950 border border-cyan-500/40 px-2 py-1 rounded text-[9px] text-cyan-300 font-mono mt-1 shadow-xl">
                              GPS Target Device
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </div>

                  {/* Active Social Counter & Blocking Widgets */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Social Apps Monitor widget */}
                    <div className="bg-[#121214] border border-[#27272A] p-5 rounded-xl flex-1 flex flex-col">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Interacted Platforms</h3>
                      <div className="space-y-3.5 flex-1 justify-center flex flex-col">
                        
                        {[
                          { name: 'WhatsApp', color: 'bg-emerald-500', count: state.messages.filter(m => m.platform === 'whatsapp').length },
                          { name: 'Tinder Dating', color: 'bg-rose-500', count: state.messages.filter(m => m.platform === 'tinder').length },
                          { name: 'Snapchat Log', color: 'bg-amber-400', count: state.messages.filter(m => m.platform === 'snapchat').length },
                          { name: 'Instagram DM', color: 'bg-purple-500', count: state.messages.filter(m => m.platform === 'instagram').length }
                        ].map((plat, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-300 font-medium">{plat.name}</span>
                              <span className="font-mono text-zinc-500 font-bold">{plat.count} actions</span>
                            </div>
                            <div className="w-full bg-[#1C1C1F] h-1.5 rounded-full overflow-hidden">
                              <div className={`${plat.color} h-full transition-all duration-500`} style={{ width: `${Math.min(plat.count * 20, 100)}%` }}></div>
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                    {/* Quick Safety Summary Indicator */}
                    <div className="bg-emerald-900/10 border border-emerald-500/20 p-5 rounded-xl">
                      <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> 
                        Security Telemetry
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        No hardware tampering or bootloader bypass guides accessed in the past hour. Mobile kernel root scans intact.
                      </p>
                      <div className="mt-3.5 pt-2 border-t border-emerald-500/10 flex items-center gap-2">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded font-mono font-bold">KERNEL STATUS: SECURE</span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Safety Alerts Feed */}
                <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[#27272A] flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white font-display">Simulated Live Warning Alerts</h3>
                    <span className="text-xs text-zinc-500 font-mono">Real-time alerts generated</span>
                  </div>
                  
                  {state.alerts.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                      Zero security alerts active. Child has no flagged violations currently.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1C1C1F]">
                      {state.alerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-4 flex items-center justify-between transition-all ${
                            alert.acknowledged ? 'opacity-40' : 'bg-red-950/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`p-1.5 rounded-lg ${
                              alert.severity === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              <AlertCircle className="w-4 h-4" />
                            </span>
                            <div>
                              <div className="text-xs font-semibold text-zinc-200">{alert.title}</div>
                              <p className="text-xs text-zinc-400 mt-0.5">{alert.message}</p>
                              <span className="text-[9px] text-zinc-500 font-mono block mt-1">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          
                          {!alert.acknowledged && (
                            <button 
                              onClick={() => handleAckAlert(alert.id)}
                              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-semibold transition-all"
                            >
                              Dismiss Alert
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT: 2. CALL LOGS */}
            {activeTab === 'calls' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold font-display text-white">Call Logs & Voice Recording</h1>
                  <p className="text-xs text-zinc-400 mt-1">Listen to phone wire recordings and examine call durations.</p>
                </div>

                <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[#27272A] flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-mono">{state.calls.length} logs captured</span>
                    <button 
                      onClick={handleForceSync}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh Waveforms
                    </button>
                  </div>

                  {state.calls.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 text-xs">
                      No calls logged yet. Initiate an outgoing call on the simulator!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-[#1C1C1F] bg-[#0c0c0e]">
                            <th className="p-4 font-semibold">Contact / Number</th>
                            <th className="p-4 font-semibold">Type</th>
                            <th className="p-4 font-semibold">Duration</th>
                            <th className="p-4 font-semibold">Timestamp</th>
                            <th className="p-4 font-semibold text-right">Voice Wire Simulation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C1C1F]">
                          {state.calls.map((call) => {
                            const isPlaying = playingCallId === call.id;
                            return (
                              <tr key={call.id} className="hover:bg-zinc-800/10">
                                <td className="p-4 font-medium text-white">
                                  <div>{call.contactName}</div>
                                  <div className="text-zinc-500 text-[10px] mt-0.5 font-mono">{call.phoneNumber}</div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                                    call.type === 'incoming' ? 'bg-emerald-500/10 text-emerald-400' :
                                    call.type === 'outgoing' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-red-500/10 text-red-400'
                                  }`}>
                                    {call.type.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-4 font-mono font-medium">{call.duration}</td>
                                <td className="p-4 text-zinc-400 font-mono">
                                  {new Date(call.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="p-4 text-right">
                                  {call.recordingPlayable ? (
                                    <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg">
                                      {isPlaying ? (
                                        <div className="flex items-center gap-1 px-1">
                                          <span className="w-1 bg-emerald-400 h-3 animate-pulse"></span>
                                          <span className="w-1 bg-emerald-400 h-2.5 animate-pulse delay-75"></span>
                                          <span className="w-1 bg-emerald-400 h-4 animate-pulse delay-100"></span>
                                          <span className="w-1 bg-emerald-400 h-2 animate-pulse"></span>
                                        </div>
                                      ) : (
                                        <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                                      )}
                                      <button 
                                        onClick={() => {
                                          if (isPlaying) {
                                            setPlayingCallId(null);
                                          } else {
                                            setPlayingCallId(call.id);
                                          }
                                        }}
                                        className="text-[10px] text-emerald-400 font-mono hover:underline flex items-center gap-1 font-bold"
                                      >
                                        {isPlaying ? 'PAUSE REC' : 'PLAY WIRE REC'}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-zinc-600 font-mono">Not Recorded</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Playing waveform panel info */}
                {playingCallId && (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-4 justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full animate-pulse">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Wiretap Call Audio Playback Active</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Decrypting call audio waves from device sandbox in real-time...</p>
                      </div>
                    </div>
                    <div className="w-1/3 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                      <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${audioPlaybackProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 3. MESSAGES TAB */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold font-display text-white">Social Messaging & Chats Interceptor</h1>
                  <p className="text-xs text-zinc-400 mt-1">Switch tabs to view raw database messages from Telegram, SMS, Tinder, or WhatsApp.</p>
                </div>

                {/* Platform selector row */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 select-none">
                  {[
                    { id: 'sms', label: 'SMS Texts', icon: MessageSquare },
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
                    { id: 'snapchat', label: 'Snapchat Log', icon: Ghost, color: 'text-yellow-400' },
                    { id: 'instagram', label: 'Instagram', icon: Smile, color: 'text-purple-400' },
                    { id: 'tinder', label: 'Tinder Dating', icon: Heart, color: 'text-rose-500' }
                  ].map((plat) => {
                    const IconComp = plat.icon;
                    const isActive = selectedMessagePlatform === plat.id;
                    return (
                      <button
                        key={plat.id}
                        onClick={() => setSelectedMessagePlatform(plat.id as any)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border shrink-0 transition-all ${
                          isActive 
                            ? 'bg-[#1C1C1F] border-[#27272A] text-white shadow-md' 
                            : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <IconComp className={`w-3.5 h-3.5 ${plat.color || ''}`} />
                        {plat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Filter & Messages search */}
                <div className="flex gap-3 bg-[#121214] border border-[#27272A] p-3 rounded-xl items-center">
                  <Search className="w-4 h-4 text-zinc-500 ml-2" />
                  <input 
                    type="text" 
                    placeholder="Search logs by keyword..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-xs text-white focus:outline-none w-full"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-zinc-300 text-xs font-mono mr-2">Clear</button>
                  )}
                </div>

                {/* Interactive chats display */}
                <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden divide-y divide-[#1C1C1F]">
                  {(() => {
                    const filtered = state.messages.filter(m => 
                      m.platform === selectedMessagePlatform &&
                      (searchQuery ? m.text.toLowerCase().includes(searchQuery.toLowerCase()) || m.contactName.toLowerCase().includes(searchQuery.toLowerCase()) : true)
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="p-12 text-center text-zinc-500 text-xs">
                          No message logs found on this platform matching query. Try typing on the companion emulator!
                        </div>
                      );
                    }

                    return filtered.map((msg) => (
                      <div key={msg.id} className="p-4 flex items-start gap-4 hover:bg-zinc-800/5 transition-all">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          msg.isIncoming ? 'bg-zinc-900 border border-zinc-800 text-zinc-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{msg.contactName}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                msg.isIncoming ? 'bg-zinc-900 text-zinc-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {msg.isIncoming ? 'INCOMING' : 'OUTGOING'}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed bg-[#1c1c1f]/40 p-2.5 rounded-lg border border-zinc-800/40">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. GPS & GEOFENCING */}
            {activeTab === 'gps' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold font-display text-white">GPS Coordinate Tracking & Geofences</h1>
                  <p className="text-xs text-zinc-400 mt-1">Add virtual circular boundaries on a live location vector track.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Create geofence section */}
                  <div className="lg:col-span-5 bg-[#121214] border border-[#27272A] p-5 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-4">Add Custom Virtual Sector</h3>
                    
                    <form onSubmit={handleAddGeofence} className="space-y-4 text-xs">
                      <div>
                        <label className="text-zinc-400 block mb-1">Sector Name</label>
                        <input 
                          type="text" 
                          value={fenceName}
                          onChange={e => setFenceName(e.target.value)}
                          placeholder="e.g. Forbidden Alley, High School" 
                          className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-zinc-400 block mb-1">Center Latitude</label>
                          <input 
                            type="text" 
                            value={fenceLat}
                            onChange={e => setFenceLat(e.target.value)}
                            className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-lg p-2.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 block mb-1">Center Longitude</label>
                          <input 
                            type="text" 
                            value={fenceLng}
                            onChange={e => setFenceLng(e.target.value)}
                            className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-lg p-2.5 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-zinc-400 block mb-1">Fence Radius (Meters)</label>
                          <select 
                            value={fenceRadius}
                            onChange={e => setFenceRadius(e.target.value)}
                            className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-lg p-2.5 text-white"
                          >
                            <option value="100">100m Sector</option>
                            <option value="200">200m Sector</option>
                            <option value="300">300m Sector</option>
                            <option value="500">500m Sector</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-zinc-400 block mb-1">Boundary Action</label>
                          <select 
                            value={fenceType}
                            onChange={e => setFenceType(e.target.value as any)}
                            className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-lg p-2.5 text-white font-semibold"
                          >
                            <option value="safe">SAFE ZONE</option>
                            <option value="restricted">RESTRICTED SECTION</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors shadow-lg"
                      >
                        Insert Geofence Boundary
                      </button>
                    </form>
                  </div>

                  {/* List active geofences */}
                  <div className="lg:col-span-7 bg-[#121214] border border-[#27272A] p-5 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-4">Active Guardian Sector Guardrails</h3>
                    
                    {state.geofences.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500">
                        No geofences created yet. Insert your first guardian sector to detect boundary entry/exits!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {state.geofences.map((fence) => (
                          <div key={fence.id} className="p-3.5 bg-[#1C1C1F] border border-[#27272A]/80 rounded-lg flex items-center justify-between">
                            <div className="flex items-start gap-2.5">
                              <span className={`p-1.5 rounded ${
                                fence.type === 'safe' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                              }`}>
                                <MapPin className="w-4 h-4" />
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-white">{fence.name}</h4>
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                  Radius: {fence.radius}m | Lat: {fence.latitude.toFixed(4)}, Lng: {fence.longitude.toFixed(4)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
                                fence.type === 'safe' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {fence.type.toUpperCase()}
                              </span>
                              <button 
                                onClick={() => handleDeleteGeofence(fence.id)}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TAB CONTENT: 5. KEYLOGGER TIMELINE */}
            {activeTab === 'keylogger' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold font-display text-white">Keylogger Intercept Logs</h1>
                  <p className="text-xs text-zinc-400 mt-1">Chronological history of text and search phrases typed inside various applications.</p>
                </div>

                <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-[#27272A] flex justify-between items-center select-none">
                    <span className="text-xs text-zinc-500 font-mono">{state.keylogger.length} intercepts in memory</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">KEYLOGGER ENGINE: LIVE</span>
                  </div>

                  {state.keylogger.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 text-xs">
                      No keystrokes logged yet. Type notes or send chats on the mobile emulator to intercept keystrokes!
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1C1C1F]">
                      {state.keylogger.map((key) => (
                        <div key={key.id} className="p-4 flex items-start gap-4 hover:bg-zinc-800/10 transition-all">
                          <div className="p-1.5 bg-zinc-800 rounded font-mono text-[9px] text-cyan-400 font-bold tracking-tight shrink-0">
                            {key.app.substring(0, 8).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300 font-mono select-all bg-black/30 p-2 rounded border border-zinc-800/50">
                              "{key.text}"
                            </p>
                            <span className="text-[10px] text-zinc-500 font-mono block mt-1.5">
                              Captured: {new Date(key.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 6. APP & WEBSITE BLOCKING */}
            {activeTab === 'blocking' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold font-display text-white">Access Control, Blocks & Filters</h1>
                  <p className="text-xs text-zinc-400 mt-1">Block applications or websites. Blocked categories immediately trigger warnings.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Apps Block list toggles */}
                  <div className="lg:col-span-6 bg-[#121214] border border-[#27272A] p-5 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-4">Application Blocking Toggles</h3>
                    
                    <div className="space-y-3">
                      {state.blockedApps.map((app) => (
                        <div key={app.appName} className="p-3.5 bg-[#1C1C1F] border border-[#27272A]/80 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-lg ${
                              app.isBlocked ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {app.appName === 'Tinder' ? <Heart className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-white">{app.appName}</h4>
                              <p className="text-[10px] text-zinc-500 font-mono">{app.packageName}</p>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleToggleBlockApp(app.appName, app.isBlocked)}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                              app.isBlocked 
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/20' 
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            {app.isBlocked ? 'BLOCKED' : 'ALLOW'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Domain Web filter block list */}
                  <div className="lg:col-span-6 space-y-6">
                    
                    {/* Block form */}
                    <div className="bg-[#121214] border border-[#27272A] p-5 rounded-xl">
                      <h3 className="text-sm font-bold text-white mb-4">Block Web Domain</h3>
                      <form onSubmit={handleAddBlockSite} className="space-y-3 text-xs">
                        <div>
                          <label className="text-zinc-400 block mb-1">Web Domain URL</label>
                          <input 
                            type="text" 
                            value={blockUrl}
                            onChange={e => setBlockUrl(e.target.value)}
                            placeholder="e.g. vape-deals-kids.com, badweb.com" 
                            className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-400 block mb-1">Filtering Reason</label>
                          <input 
                            type="text" 
                            value={blockReason}
                            onChange={e => setBlockReason(e.target.value)}
                            placeholder="e.g. Adult Content, Online Gaming Bypass" 
                            className="w-full bg-[#1C1C1F] border border-[#27272A] rounded-lg p-2.5 text-white focus:outline-none"
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="w-full py-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded font-semibold transition-all mt-2"
                        >
                          Enforce Website Domain Block
                        </button>
                      </form>
                    </div>

                    {/* Blocked domains table */}
                    <div className="bg-[#121214] border border-[#27272A] p-5 rounded-xl">
                      <h3 className="text-sm font-bold text-white mb-3">Enforced Blocklist Profiles</h3>
                      
                      {state.blockedSites.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500 text-xs">
                          No blocked websites enforced yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {state.blockedSites.map((site) => (
                            <div key={site.id} className="p-2 bg-[#1C1C1F] rounded border border-[#27272A]/60 flex items-center justify-between text-xs">
                              <div className="min-w-0">
                                <span className="font-mono font-bold text-red-400 truncate block">{site.url}</span>
                                <span className="text-[10px] text-zinc-500">{site.reason}</span>
                              </div>
                              <button 
                                onClick={() => handleDeleteBlockSite(site.id)}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* TAB CONTENT: 7. SCREEN TIMELINE CAPTURES */}
            {activeTab === 'screenshots' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold font-display text-white">Live App Screen timeline</h1>
                  <p className="text-xs text-zinc-400 mt-1">Intercept active mobile screenshots of screen panels in real-time.</p>
                </div>

                <div className="bg-[#121214] border border-[#27272A] rounded-xl overflow-hidden p-6">
                  
                  {state.screenshots.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      No screen captures logged.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {state.screenshots.map((shot) => (
                        <div key={shot.id} className="bg-[#1c1c1f] rounded-xl overflow-hidden border border-[#27272A] group">
                          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                            <img 
                              src={shot.screenshotUrl} 
                              alt="Target phone screenshot capture" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                            <span className="absolute bottom-3 left-3 bg-zinc-950/90 border border-zinc-800 px-2 py-1 rounded text-[10px] font-mono text-zinc-300 uppercase tracking-widest font-bold">
                              {shot.app} Screen
                            </span>
                          </div>
                          
                          <div className="p-3 flex justify-between items-center bg-[#121214]">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Intercepted: {new Date(shot.timestamp).toLocaleTimeString()}
                            </span>
                            <a 
                              href={shot.screenshotUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-emerald-400 hover:underline font-mono"
                            >
                              Download PNG
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* TAB CONTENT: 8. GEMINI AI ANALYTICS HEALTH EVALUATION */}
            {activeTab === 'ai_report' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                      Gemini Parental Intelligence Analysis
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                      Deep-learning diagnostic safety evaluation on calls, messages, browser history, and keyboard strokes.
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleRunAiAnalysis}
                    disabled={aiLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-950/30 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Reprocessing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Rerun AI Diagnostic
                      </>
                    )}
                  </button>
                </div>

                {aiLoading ? (
                  <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 border-4 border-purple-500/10 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-bold text-white font-display">Parsing Mobile Database Activity...</h3>
                    <p className="text-xs text-zinc-500 mt-2 max-w-md leading-relaxed">
                      Gemini is scanning private SMS logs, web browsing sessions, tinder message logs, and geofence alarms to outline safe-parenting recommendations.
                    </p>
                  </div>
                ) : aiReport ? (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* RISK TIER STRIP */}
                    <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      aiReport.riskLevel === 'high' ? 'bg-red-950/20 border-red-500/30 text-red-300' :
                      aiReport.riskLevel === 'medium' ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' :
                      'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          aiReport.riskLevel === 'high' ? 'bg-red-500/20' :
                          aiReport.riskLevel === 'medium' ? 'bg-amber-500/20' :
                          'bg-emerald-500/20'
                        }`}>
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs uppercase font-mono tracking-wider font-bold">Threat Evaluation Index</div>
                          <h3 className="text-xl font-bold mt-0.5 font-display">
                            {aiReport.riskLevel.toUpperCase()} RISK WARNING
                          </h3>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-medium px-3 py-1 bg-black/40 rounded-full border border-current/20">
                        Evaluated UTC: 2026-07-04
                      </span>
                    </div>

                    {/* EXECUTIVE DIAGNOSTIC SUMMARY */}
                    <div className="bg-[#121214] border border-[#27272A] p-6 rounded-2xl">
                      <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        Executive Intelligence Summary
                      </h3>
                      <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                        {aiReport.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* FLAGGED KEYWORD BLOCKS */}
                      <div className="lg:col-span-6 bg-[#121214] border border-[#27272A] p-6 rounded-2xl">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <Skull className="w-4 h-4 text-purple-400" />
                          Flagged Intercept Transcripts
                        </h3>
                        
                        {aiReport.flaggedPhrases.length === 0 ? (
                          <p className="text-xs text-zinc-500">No high-priority flagged terms extracted.</p>
                        ) : (
                          <div className="space-y-3">
                            {aiReport.flaggedPhrases.map((phrase, idx) => (
                              <div key={idx} className="p-3 bg-[#1C1C1F] rounded-xl border border-zinc-800/80 flex items-start justify-between text-xs gap-3">
                                <div>
                                  <span className="font-mono font-bold text-white block">"{phrase.text}"</span>
                                  <span className="text-[10px] text-purple-400 mt-1 font-semibold block uppercase tracking-wide">
                                    {phrase.category}
                                  </span>
                                </div>
                                <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-mono text-zinc-400 shrink-0 uppercase">
                                  {phrase.source}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ACTIONABLE PARENTAL ADVOCATION STEPS */}
                      <div className="lg:col-span-6 bg-[#121214] border border-[#27272A] p-6 rounded-2xl">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-400" />
                          Clinical Parental Guidance Protocol
                        </h3>
                        
                        <div className="space-y-3.5">
                          {aiReport.parentalGuidance.map((guide, idx) => (
                            <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                              <span className="font-mono text-purple-400 font-bold shrink-0 bg-purple-500/10 w-5 h-5 rounded-full flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <p className="text-zinc-300">{guide}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <Sparkles className="w-12 h-12 text-purple-400/40 animate-pulse mb-4" />
                    <h3 className="text-base font-bold text-white font-display">No Diagnostic Analysis Prepared</h3>
                    <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-normal">
                      Initiate the server-side Gemini scanner below to evaluate the teen's activity history and recommend action plans.
                    </p>
                    <button 
                      onClick={handleRunAiAnalysis}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs mt-6 transition-all"
                    >
                      Process Activity Analysis Report
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: TARGET PHONE SIMULATOR SIDEBAR */}
          <div className="w-full xl:w-[380px] shrink-0 border-t xl:border-t-0 xl:border-l border-[#27272A] bg-[#0c0c0e] p-6 md:p-8 flex flex-col justify-start overflow-y-auto select-none gap-6">
            <div className="text-center xl:text-left">
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                Companion Sandbox Emulator
              </span>
              <h3 className="text-lg font-bold font-display text-white mt-1.5">Child's Simulated Smartphone</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Interact with this live target handset. Try typing messages, triggering calls, or jumping coordinates to view immediately synced logs.
              </p>
            </div>

            <PhoneSimulator state={state} onActionTriggered={() => fetchState(true)} />
          </div>

        </div>

      </main>
    </div>
  );
}
