import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Compass, 
  Chrome, 
  ShieldAlert, 
  Home, 
  Send, 
  Smartphone, 
  Wifi, 
  Battery, 
  ArrowLeft, 
  Lock, 
  Sparkles,
  Heart,
  Smile,
  Ghost
} from 'lucide-react';
import { MonitoringState } from '../types';

interface PhoneSimulatorProps {
  state: MonitoringState;
  onActionTriggered: () => void;
}

export default function PhoneSimulator({ state, onActionTriggered }: PhoneSimulatorProps) {
  const [activeApp, setActiveApp] = useState<'home' | 'whatsapp' | 'browser' | 'phone' | 'gps' | 'keylogger' | 'tinder'>('home');
  const [inputText, setInputText] = useState('');
  const [browserUrl, setBrowserUrl] = useState('https://google.com');
  const [contactToCall, setContactToCall] = useState('Alex Mercer');
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [keyloggerDraft, setKeyloggerDraft] = useState('');
  const [tinderMessage, setTinderMessage] = useState('');

  // Local clock for the status bar
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Call timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCalling) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  // Check if current app is blocked by Parent
  const getAppBlockStatus = (appName: string): boolean => {
    const matched = state.blockedApps.find(app => app.appName.toLowerCase() === appName.toLowerCase());
    return matched ? matched.isBlocked : false;
  };

  const handleSendWhatsApp = async () => {
    if (!inputText.trim()) return;
    try {
      await fetch('/api/state/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'whatsapp',
          contactName: 'Study Group',
          text: inputText,
          isIncoming: false // child typing
        })
      });
      
      // Also log to keylogger
      await fetch('/api/state/keylogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: 'WhatsApp',
          text: inputText
        })
      });

      setInputText('');
      onActionTriggered();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTinder = async () => {
    if (!tinderMessage.trim()) return;
    try {
      await fetch('/api/state/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'tinder',
          contactName: 'Jessica, 19',
          text: tinderMessage,
          isIncoming: false
        })
      });

      await fetch('/api/state/keylogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: 'Tinder',
          text: tinderMessage
        })
      });

      setTinderMessage('');
      onActionTriggered();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBrowserSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!browserUrl.trim()) return;
    
    let title = 'Google Search';
    let urlToLog = browserUrl;
    
    if (!browserUrl.startsWith('http://') && !browserUrl.startsWith('https://')) {
      title = `Google: "${browserUrl}"`;
      urlToLog = `https://google.com/search?q=${encodeURIComponent(browserUrl)}`;
      
      // Keylog search term
      await fetch('/api/state/keylogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: 'Chrome Search',
          text: browserUrl
        })
      });
    } else {
      title = browserUrl.replace('https://', '').replace('http://', '').split('/')[0];
    }

    try {
      await fetch('/api/state/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url: urlToLog })
      });
      onActionTriggered();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerCallSim = async () => {
    if (isCalling) {
      // Hang up
      setIsCalling(false);
      const minutes = Math.floor(callDuration / 60).toString().padStart(2, '0');
      const seconds = (callDuration % 60).toString().padStart(2, '0');
      
      try {
        await fetch('/api/state/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactName: contactToCall,
            phoneNumber: contactToCall === 'Alex Mercer' ? '+1 (555) 019-2831' : '+1 (555) 902-1209',
            type: 'outgoing',
            duration: `${minutes}:${seconds}`
          })
        });
        onActionTriggered();
      } catch (err) {
        console.error(err);
      }
    } else {
      // Start call
      setIsCalling(true);
    }
  };

  const changeLocation = async (lat: number, lng: number, label: string) => {
    try {
      // Update GPS info
      await fetch('/api/state/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gpsLatitude: lat,
          gpsLongitude: lng
        })
      });

      // Simple alert trigger on frontend side if child enters/exits high school or bar district
      // Home safezone: (40.7128, -74.0060)
      // School safezone: (40.7185, -74.0115)
      // Bar district: (40.7250, -73.9980)
      if (label === 'Downtown Bar District') {
        // Trigger Geofence violation
        await fetch('/api/state/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: 'sms',
            contactName: 'Local Liquor Store',
            text: 'Your order of draft spirits is ready for quick pickup in alleyway.',
            isIncoming: true
          })
        });
      }

      onActionTriggered();
    } catch (err) {
      console.error(err);
    }
  };

  const logCustomKeystroke = async () => {
    if (!keyloggerDraft.trim()) return;
    try {
      await fetch('/api/state/keylogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: 'Notes App',
          text: keyloggerDraft
        })
      });
      setKeyloggerDraft('');
      onActionTriggered();
    } catch (err) {
      console.error(err);
    }
  };

  const isTinderBlocked = getAppBlockStatus('Tinder');
  const isSnapchatBlocked = getAppBlockStatus('Snapchat');
  const isTikTokBlocked = getAppBlockStatus('TikTok');

  return (
    <div className="w-full max-w-[340px] mx-auto bg-slate-900 border-[8px] border-slate-700 rounded-[38px] shadow-2xl relative overflow-hidden aspect-[9/19.2] flex flex-col ring-4 ring-cyan-500/10">
      
      {/* Phone Ear Speaker / Camera Notch */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-700 rounded-b-2xl z-50 flex items-center justify-center">
        <div className="w-12 h-1 bg-slate-900 rounded-full mb-1"></div>
        <div className="w-2 h-2 bg-slate-800 rounded-full ml-2 mb-1"></div>
      </div>

      {/* Phone Status Bar */}
      <div className="h-10 bg-slate-950 flex justify-between items-end px-6 pb-1 text-xs text-slate-300 font-medium select-none z-40">
        <span>{currentTime}</span>
        <div className="flex items-center gap-2">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-mono">5G</span>
          <div className="flex items-center gap-1">
            <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
            <span>{state.deviceInfo?.battery || 84}%</span>
          </div>
        </div>
      </div>

      {/* Screen Content Wrapper */}
      <div className="flex-1 bg-slate-950 relative flex flex-col text-white sim-phone-screen">
        
        {/* APP BLOCK OVERLAY (Check blocking real-time) */}
        {((activeApp === 'tinder' && isTinderBlocked) ||
          (activeApp === 'gps' && isTikTokBlocked)) && (
          <div className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-950 border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl font-bold text-red-500 mb-2">Access Blocked</h3>
            <p className="text-slate-400 text-sm mb-6">
              This application has been blocked on this device by <strong>mSpy Parental Control</strong>.
            </p>
            <button 
              onClick={() => setActiveApp('home')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all"
            >
              Go to Home Screen
            </button>
          </div>
        )}

        {/* 1. HOME SCREEN */}
        {activeApp === 'home' && (
          <div className="flex-1 flex flex-col p-5">
            {/* Lockscreen style greeting */}
            <div className="text-center mt-6 mb-8">
              <h2 className="text-3xl font-light text-slate-100 font-display">Target Device</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">Monitored Galaxy S24 Active</p>
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-3 gap-y-6 gap-x-4 flex-1 content-start mt-4">
              
              {/* WhatsApp app icon */}
              <button 
                onClick={() => setActiveApp('whatsapp')}
                className="flex flex-col items-center gap-1.5 focus:outline-none group"
              >
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-7 h-7 text-white" />
                </div>
                <span className="text-[11px] text-slate-200 font-medium">WhatsApp</span>
              </button>

              {/* Chrome app icon */}
              <button 
                onClick={() => setActiveApp('browser')}
                className="flex flex-col items-center gap-1.5 focus:outline-none group"
              >
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Chrome className="w-7 h-7 text-white" />
                </div>
                <span className="text-[11px] text-slate-200 font-medium">Chrome</span>
              </button>

              {/* Dialer App */}
              <button 
                onClick={() => setActiveApp('phone')}
                className="flex flex-col items-center gap-1.5 focus:outline-none group"
              >
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <span className="text-[11px] text-slate-200 font-medium">Phone</span>
              </button>

              {/* Tinder (Simulates blocked app or teen dating) */}
              <button 
                onClick={() => setActiveApp('tinder')}
                className="flex flex-col items-center gap-1.5 focus:outline-none group relative"
              >
                <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Heart className="w-7 h-7 text-white fill-white" />
                </div>
                <span className="text-[11px] text-slate-200 font-medium flex items-center gap-0.5">
                  Tinder {isTinderBlocked && <Lock className="w-2.5 h-2.5 text-red-400" />}
                </span>
              </button>

              {/* Keylogger Simulation (Notes pad) */}
              <button 
                onClick={() => setActiveApp('keylogger')}
                className="flex flex-col items-center gap-1.5 focus:outline-none group"
              >
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-slate-700">
                  <span className="font-mono text-lg font-bold text-cyan-400">KEY</span>
                </div>
                <span className="text-[11px] text-slate-200 font-medium">Notes Pad</span>
              </button>

              {/* GPS Simulation */}
              <button 
                onClick={() => setActiveApp('gps')}
                className="flex flex-col items-center gap-1.5 focus:outline-none group"
              >
                <div className="w-14 h-14 bg-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Compass className="w-7 h-7 text-white" />
                </div>
                <span className="text-[11px] text-slate-200 font-medium">GPS Sim</span>
              </button>

            </div>

            {/* Instruction Footer */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-center text-[11px] text-slate-400 mt-auto leading-relaxed select-none">
              <Sparkles className="w-4 h-4 text-cyan-400 mx-auto mb-1 animate-pulse" />
              Perform actions on this phone simulator to watch them appear in the <strong>Parent Control Dashboard</strong>!
            </div>
          </div>
        )}

        {/* 2. WHATSAPP APP SIMULATOR */}
        {activeApp === 'whatsapp' && (
          <div className="flex-1 flex flex-col">
            {/* App Header */}
            <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-2">
              <button onClick={() => setActiveApp('home')} className="p-1 hover:bg-slate-800 rounded-full text-slate-300">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h4 className="font-bold text-xs">Study Group 🧪</h4>
                <p className="text-[9px] text-emerald-400">Alex, Sarah, You</p>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-[url('https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400')] bg-cover bg-opacity-10">
              <div className="bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 p-1.5 rounded-lg text-center self-center my-1 select-none">
                🔒 Messages are end-to-end monitored by mSpy
              </div>
              <div className="bg-slate-900/95 border border-slate-800 rounded-lg p-2 max-w-[80%] self-start">
                <p className="text-[10px] text-emerald-400 font-bold mb-0.5">Alex Mercer</p>
                <p className="text-xs">Hey, are we bringing the vape pods to school or what? Need some puffs during recess.</p>
                <span className="text-[8px] text-slate-500 block text-right mt-0.5">10:14 AM</span>
              </div>
              <div className="bg-emerald-950/95 border border-emerald-900 rounded-lg p-2 max-w-[80%] self-end">
                <p className="text-xs">Keep it quiet. Don't post it in the public group chat!</p>
                <span className="text-[8px] text-emerald-400/60 block text-right mt-0.5">10:15 AM</span>
              </div>

              {/* Dynamically added WhatsApp logs */}
              {state.messages
                .filter(m => m.platform === 'whatsapp')
                .slice()
                .reverse()
                .map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`rounded-lg p-2 max-w-[80%] ${
                      msg.isIncoming 
                        ? 'bg-slate-900/95 border border-slate-800 self-start' 
                        : 'bg-emerald-950/95 border border-emerald-900 self-end'
                    }`}
                  >
                    <p className="text-[10px] font-bold mb-0.5 text-slate-400">
                      {msg.isIncoming ? msg.contactName : 'You'}
                    </p>
                    <p className="text-xs">{msg.text}</p>
                    <span className="text-[8px] text-slate-500 block text-right mt-0.5">Just now</span>
                  </div>
                ))}
            </div>

            {/* Input Bar */}
            <div className="bg-slate-900 p-2 border-t border-slate-800 flex gap-2 items-center">
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type a flagged message..." 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                onKeyDown={e => e.key === 'Enter' && handleSendWhatsApp()}
              />
              <button 
                onClick={handleSendWhatsApp}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-full transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 3. CHROME BROWSER SIMULATOR */}
        {activeApp === 'browser' && (
          <div className="flex-1 flex flex-col">
            {/* URL/Search Bar */}
            <form onSubmit={handleBrowserSearch} className="bg-slate-900 p-2 border-b border-slate-800 flex items-center gap-2">
              <button type="button" onClick={() => setActiveApp('home')} className="p-1 hover:bg-slate-800 rounded-full text-slate-300">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-3 py-1 flex items-center gap-1.5">
                <Chrome className="w-3 h-3 text-slate-500" />
                <input 
                  type="text" 
                  value={browserUrl}
                  onChange={e => setBrowserUrl(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-200 focus:outline-none w-full"
                />
              </div>
            </form>

            {/* Webpage Content simulation */}
            <div className="flex-1 bg-slate-950 p-4 overflow-y-auto flex flex-col">
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40 text-center mb-4">
                <Chrome className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h3 className="font-bold text-sm">Chrome Web Search</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Try searching phrases like <strong>"vape pods cheap"</strong>, <strong>"cheat on chemistry test"</strong>, or <strong>"how to bypass parental lock"</strong> to see mSpy keylog & block rules trigger!
                </p>
              </div>

              <div className="text-xs text-slate-400 mt-2">
                <p className="font-semibold mb-1 text-slate-300">Trending Searches:</p>
                <ul className="space-y-1.5 pl-1">
                  {['vape pens online delivery', 'how to bypass parent lock', 'unblocked gaming sites', 'chemistry guide'].map((term, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => {
                        setBrowserUrl(term);
                      }}
                      className="cursor-pointer hover:text-cyan-400 hover:underline flex items-center gap-1.5"
                    >
                      🔍 {term}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 4. PHONE DIALER SIMULATOR */}
        {activeApp === 'phone' && (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setActiveApp('home')} className="p-1 hover:bg-slate-800 rounded-full text-slate-300">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h4 className="font-bold text-xs">Simulated Phone Call</h4>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
              {isCalling ? (
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-950 border-2 border-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                    <Phone className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold">{contactToCall}</h3>
                  <p className="text-sm text-emerald-400 font-mono mt-1">
                    {Math.floor(callDuration / 60).toString().padStart(2, '0')}:
                    {(callDuration % 60).toString().padStart(2, '0')}
                  </p>
                  <p className="text-xs text-slate-400 mt-3 italic">"Simulating Audio Call Recording..."</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Phone className="w-8 h-8 text-slate-400" />
                  </div>
                  <label className="text-xs text-slate-400 block mb-2 font-semibold">Choose contact to simulate calling:</label>
                  <select 
                    value={contactToCall}
                    onChange={e => setContactToCall(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs mb-4 focus:outline-none"
                  >
                    <option value="Alex Mercer">Alex Mercer (Vape supplier friend)</option>
                    <option value="Strangertalks">Suspicious Unknown Seller (+1 555-2101)</option>
                    <option value="Mom">Mom</option>
                  </select>
                </div>
              )}

              <button 
                onClick={triggerCallSim}
                className={`w-full py-3 rounded-2xl font-bold text-sm mt-6 shadow-lg transition-all ${
                  isCalling 
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-500/10' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10'
                }`}
              >
                {isCalling ? 'End Call & Record' : 'Initiate Call'}
              </button>
            </div>
          </div>
        )}

        {/* 5. TINDER DATING SIMULATOR */}
        {activeApp === 'tinder' && (
          <div className="flex-1 flex flex-col">
            <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center gap-2">
              <button onClick={() => setActiveApp('home')} className="p-1 hover:bg-slate-800 rounded-full text-slate-300">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h4 className="font-bold text-xs text-rose-500 flex items-center gap-1 font-display">
                <Heart className="w-3.5 h-3.5 fill-rose-500" /> Tinder Sim
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              <div className="rounded-xl border border-rose-950 bg-rose-950/20 p-3 mb-2">
                <p className="text-[11px] text-rose-400 leading-normal">
                  💡 Teenagers often bypass restrictions by chatting on dating apps. mSpy tracks and alerts on Tinder messages.
                </p>
              </div>

              <div className="bg-slate-900 rounded-xl p-2 border border-slate-800">
                <p className="text-[10px] text-rose-400 font-bold">Matched with Jessica, 19</p>
                <p className="text-[11px] text-slate-300 mt-1">"Hey there! Want to meet up behind the park after hours?"</p>
              </div>

              {state.messages
                .filter(m => m.platform === 'tinder')
                .map((msg) => (
                  <div key={msg.id} className="bg-slate-900 rounded-xl p-2 border border-slate-800 self-end max-w-[90%]">
                    <p className="text-[10px] text-slate-400 font-bold">You</p>
                    <p className="text-xs text-slate-200">{msg.text}</p>
                  </div>
                ))}
            </div>

            <div className="bg-slate-900 p-2 border-t border-slate-800 flex gap-2 items-center">
              <input 
                type="text" 
                value={tinderMessage}
                onChange={e => setTinderMessage(e.target.value)}
                placeholder="Type a reply..." 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-3 py-1.5 text-xs focus:outline-none"
                onKeyDown={e => e.key === 'Enter' && handleSendTinder()}
              />
              <button 
                onClick={handleSendTinder}
                className="p-2 bg-rose-600 hover:bg-rose-500 rounded-full transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 6. KEYLOGGER NOTE PAD SIMULATOR */}
        {activeApp === 'keylogger' && (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setActiveApp('home')} className="p-1 hover:bg-slate-800 rounded-full text-slate-300">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h4 className="font-bold text-xs">Note Pad Keylogger Demo</h4>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <label className="text-xs text-slate-400 leading-normal">
                Type sensitive phrases into this notepad. Everything typed here simulates a real-time keypress event that mSpy intercepts.
              </label>
              
              <textarea 
                value={keyloggerDraft}
                onChange={e => setKeyloggerDraft(e.target.value)}
                placeholder="Write notes here... (e.g. 'suicide attempt guide', 'buying beer illegally')"
                className="w-full flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans resize-none"
              />

              <button 
                onClick={logCustomKeystroke}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-xs text-white"
              >
                Save & Simulate Keylogger capture
              </button>
            </div>
          </div>
        )}

        {/* 7. GPS COORDINATES SIMULATOR */}
        {activeApp === 'gps' && (
          <div className="flex-1 flex flex-col p-4">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setActiveApp('home')} className="p-1 hover:bg-slate-800 rounded-full text-slate-300">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h4 className="font-bold text-xs">GPS Location Simulator</h4>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <p className="text-xs text-slate-400 leading-normal">
                Draw virtual geofences inside the parent control panel. Move the child's location coordinates dynamically to trigger alarms.
              </p>

              <div className="space-y-3">
                <button 
                  onClick={() => changeLocation(40.7128, -74.0060, 'Home Safezone')}
                  className="w-full p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-xl text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs block text-slate-200">Home Safezone</span>
                    <span className="text-[10px] text-slate-500 font-mono">40.7128, -74.0060</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">SAFE</span>
                </button>

                <button 
                  onClick={() => changeLocation(40.7185, -74.0115, 'High School')}
                  className="w-full p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-xl text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs block text-slate-200">High School</span>
                    <span className="text-[10px] text-slate-500 font-mono">40.7185, -74.0115</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">SAFE</span>
                </button>

                <button 
                  onClick={() => changeLocation(40.7250, -73.9980, 'Downtown Bar District')}
                  className="w-full p-3 bg-slate-900 border border-slate-800 hover:border-red-500 rounded-xl text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs block text-slate-200">Downtown Bar District</span>
                    <span className="text-[10px] text-slate-500 font-mono">40.7250, -73.9980</span>
                  </div>
                  <span className="text-xs text-red-400 font-semibold">RESTRICTED</span>
                </button>
              </div>

              {/* Status Display */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 text-center mt-auto">
                <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Current GPS Coordinates</span>
                <span className="text-sm font-bold font-mono text-cyan-400">
                  {state.deviceInfo?.gpsLatitude.toFixed(4)}, {state.deviceInfo?.gpsLongitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Phone Navigation Bottom Bar */}
      <div className="h-12 bg-slate-950 flex items-center justify-center px-6 border-t border-slate-900 select-none">
        <button 
          onClick={() => setActiveApp('home')}
          className="w-10 h-10 hover:bg-slate-800 rounded-full flex items-center justify-center transition-colors focus:outline-none"
        >
          <Home className="w-5 h-5 text-slate-400" />
        </button>
      </div>

    </div>
  );
}
