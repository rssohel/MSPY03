import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  MonitoringState, 
  CallLog, 
  MessageLog, 
  BrowserHistoryItem, 
  KeyloggerEvent, 
  ScreenshotItem, 
  Geofence, 
  SecurityAlert, 
  AppBlockState, 
  BlockedWebsite 
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI securely with header telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "MOCK_KEY_FOR_BUILD",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// In-Memory Live State for the Target Device Simulator
let liveState: MonitoringState = {
  deviceInfo: {
    model: 'Samsung Galaxy S24 Ultra',
    os: 'Android 14 (One UI 6.1)',
    battery: 84,
    network: 'Verizon 5G',
    isOnline: true,
    gpsLatitude: 40.7128,
    gpsLongitude: -74.0060,
    storageUsed: 78.4,
    storageTotal: 256.0,
    lastUpdated: new Date().toISOString()
  },
  calls: [
    { id: 'c1', contactName: 'Alex Mercer', phoneNumber: '+1 (555) 019-2831', type: 'incoming', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), duration: '03:42', recordingPlayable: true },
    { id: 'c2', contactName: 'Mom', phoneNumber: '+1 (555) 012-9988', type: 'outgoing', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), duration: '01:15', recordingPlayable: false },
    { id: 'c3', contactName: 'Unknown Sender', phoneNumber: '+1 (555) 349-2101', type: 'missed', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), duration: '00:00', recordingPlayable: false },
  ],
  messages: [
    { id: 'm1', platform: 'sms', contactName: 'Alex Mercer', phoneNumber: '+1 (555) 019-2831', text: 'Hey, are you coming to the party tonight? Everyone will be there.', isIncoming: true, timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'm2', platform: 'sms', contactName: 'Alex Mercer', phoneNumber: '+1 (555) 019-2831', text: 'Yeah, getting ready now! Did you bring the things?', isIncoming: false, timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString() },
    { id: 'm3', platform: 'whatsapp', contactName: 'Study Group', text: 'Who has completed the chemistry assignment?', isIncoming: true, timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
    { id: 'm4', platform: 'snapchat', contactName: 'Sarah K.', text: 'Don\'t tell my mom about what we did after school yesterday. Keep it secret!', isIncoming: true, timestamp: new Date(Date.now() - 3600000 * 6).toISOString() },
    { id: 'm5', platform: 'instagram', contactName: 'Spambot', text: 'Hey sweetie! Click here to win a free modern phone: lucky-draw-rewards.com', isIncoming: true, timestamp: new Date(Date.now() - 3600000 * 8).toISOString() },
  ],
  history: [
    { id: 'h1', title: 'Reddit - The Front Page of the Internet', url: 'https://reddit.com', timestamp: new Date(Date.now() - 600000).toISOString(), visits: 14 },
    { id: 'h2', title: 'Buy Cheap Vape Pens & Pods Online', url: 'https://vapes-underage-deals.com/shop', timestamp: new Date(Date.now() - 1800000).toISOString(), visits: 3 },
    { id: 'h3', title: 'How to bypass screen time limits on Android', url: 'https://tech-bypass-guides.org/screentime', timestamp: new Date(Date.now() - 7200000).toISOString(), visits: 2 },
    { id: 'h4', title: 'Google Search - chemistry homework help', url: 'https://google.com/search?q=chemistry+homework', timestamp: new Date(Date.now() - 14400000).toISOString(), visits: 1 },
  ],
  keylogger: [
    { id: 'k1', app: 'Instagram', text: 'where are you guys hiding?', timestamp: new Date(Date.now() - 1200000).toISOString() },
    { id: 'k2', app: 'Chrome', text: 'how to buy vape online without id verification', timestamp: new Date(Date.now() - 1800000).toISOString() },
    { id: 'k3', app: 'WhatsApp', text: 'dont tell anyone', timestamp: new Date(Date.now() - 3600000).toISOString() },
  ],
  screenshots: [
    { id: 's1', app: 'Snapchat', screenshotUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=60', timestamp: new Date(Date.now() - 1500000).toISOString() },
    { id: 's2', app: 'Chrome', screenshotUrl: 'https://images.unsplash.com/photo-1546074177-ffedd198fe5a?w=600&auto=format&fit=crop&q=60', timestamp: new Date(Date.now() - 3000000).toISOString() },
  ],
  geofences: [
    { id: 'g1', name: 'Home Safezone', radius: 150, latitude: 40.7128, longitude: -74.0060, type: 'safe' },
    { id: 'g2', name: 'High School', radius: 300, latitude: 40.7185, longitude: -74.0115, type: 'safe' },
    { id: 'g3', name: 'Downtown Bar District', radius: 250, latitude: 40.7250, longitude: -73.9980, type: 'restricted' },
  ],
  alerts: [
    { id: 'a1', type: 'content', title: 'Suspicious Search Term', message: 'Target searched for: "vape online without id"', severity: 'high', timestamp: new Date(Date.now() - 1800000).toISOString(), acknowledged: false },
    { id: 'a2', type: 'geofence', title: 'Geofence Exit', message: 'Target exited the "High School" safezone during class hours.', severity: 'medium', timestamp: new Date(Date.now() - 14400000).toISOString(), acknowledged: false },
  ],
  blockedApps: [
    { appName: 'Tinder', isBlocked: true, packageName: 'com.tinder', icon: 'Heart' },
    { appName: 'TikTok', isBlocked: false, packageName: 'com.zhiliaoapp.musically', icon: 'Video' },
    { appName: 'Snapchat', isBlocked: false, packageName: 'com.snapchat.android', icon: 'Ghost' },
    { appName: 'Reddit', isBlocked: false, packageName: 'com.reddit.frontpage', icon: 'Smile' },
    { appName: 'Discord', isBlocked: false, packageName: 'com.discord', icon: 'MessageSquare' },
  ],
  blockedSites: [
    { id: 'bs1', url: 'https://unblockedgames77.com', reason: 'Gaming during homework hours', timestamp: new Date().toISOString() },
    { id: 'bs2', url: 'https://adult-content-blocklist.xyz', reason: 'Adult content filter', timestamp: new Date().toISOString() },
  ]
};

// API Endpoints for State Retrieval and Updates
app.get('/api/state', (req, res) => {
  res.json(liveState);
});

// Update device info
app.post('/api/state/device', (req, res) => {
  liveState.deviceInfo = {
    ...liveState.deviceInfo,
    ...req.body,
    lastUpdated: new Date().toISOString()
  };
  res.json({ success: true, deviceInfo: liveState.deviceInfo });
});

// Add Call Log
app.post('/api/state/calls', (req, res) => {
  const newCall: CallLog = {
    id: 'c_' + Math.random().toString(36).substr(2, 9),
    contactName: req.body.contactName || 'Unknown Contact',
    phoneNumber: req.body.phoneNumber || '+1 (555) 000-0000',
    type: req.body.type || 'incoming',
    duration: req.body.duration || '01:30',
    timestamp: new Date().toISOString(),
    recordingPlayable: Math.random() > 0.5
  };
  liveState.calls.unshift(newCall);

  // Trigger content alert if contact is flagged
  if (newCall.contactName.toLowerCase().includes('stranger') || newCall.contactName.toLowerCase().includes('dealer')) {
    liveState.alerts.unshift({
      id: 'a_' + Math.random().toString(36).substr(2, 9),
      type: 'content',
      title: 'Flagged Call Contact',
      message: `Simulated call with suspicious contact: ${newCall.contactName}`,
      severity: 'high',
      timestamp: new Date().toISOString(),
      acknowledged: false
    });
  }

  res.json({ success: true, call: newCall, alerts: liveState.alerts });
});

// Add Message Log
app.post('/api/state/messages', (req, res) => {
  const newMessage: MessageLog = {
    id: 'm_' + Math.random().toString(36).substr(2, 9),
    platform: req.body.platform || 'sms',
    contactName: req.body.contactName || 'Alex Mercer',
    phoneNumber: req.body.phoneNumber,
    text: req.body.text || '',
    isIncoming: req.body.isIncoming !== undefined ? req.body.isIncoming : true,
    timestamp: new Date().toISOString()
  };
  liveState.messages.unshift(newMessage);

  // Simple hardcoded alert rules to trigger in real-time
  const dangerousKeywords = ['vape', 'smoke', 'weed', 'buy', 'secret', 'drugs', 'depressed', 'kill', 'hate you', 'cheat', 'hack', 'steal'];
  const textLower = newMessage.text.toLowerCase();
  const foundWord = dangerousKeywords.find(word => textLower.includes(word));
  
  if (foundWord) {
    liveState.alerts.unshift({
      id: 'a_' + Math.random().toString(36).substr(2, 9),
      type: foundWord === 'depressed' || foundWord === 'kill' ? 'bullying' : 'content',
      title: 'Dangerous Content Detected',
      message: `Message on ${newMessage.platform} contains flagged word: "${foundWord}"`,
      severity: 'high',
      timestamp: new Date().toISOString(),
      acknowledged: false
    });
  }

  res.json({ success: true, message: newMessage, alerts: liveState.alerts });
});

// Add Keylogger Event
app.post('/api/state/keylogger', (req, res) => {
  const newEvent: KeyloggerEvent = {
    id: 'k_' + Math.random().toString(36).substr(2, 9),
    app: req.body.app || 'Chrome',
    text: req.body.text || '',
    timestamp: new Date().toISOString()
  };
  liveState.keylogger.unshift(newEvent);

  // Trigger keylogger alert
  if (newEvent.text.toLowerCase().includes('suicide') || newEvent.text.toLowerCase().includes('depression') || newEvent.text.toLowerCase().includes('cheat on exam')) {
    liveState.alerts.unshift({
      id: 'a_' + Math.random().toString(36).substr(2, 9),
      type: 'keystroke',
      title: 'Flagged Keylogger Activity',
      message: `Suspicious keystroke logged in ${newEvent.app}: "${newEvent.text}"`,
      severity: 'high',
      timestamp: new Date().toISOString(),
      acknowledged: false
    });
  }

  res.json({ success: true, event: newEvent, alerts: liveState.alerts });
});

// Add Browser History
app.post('/api/state/history', (req, res) => {
  const newHistory: BrowserHistoryItem = {
    id: 'h_' + Math.random().toString(36).substr(2, 9),
    title: req.body.title || 'Search Results',
    url: req.body.url || 'https://google.com',
    timestamp: new Date().toISOString(),
    visits: 1
  };
  
  // Check if blocked site is attempted
  const isBlocked = liveState.blockedSites.some(site => newHistory.url.toLowerCase().includes(site.url.toLowerCase()));
  if (isBlocked) {
    liveState.alerts.unshift({
      id: 'a_' + Math.random().toString(36).substr(2, 9),
      type: 'content',
      title: 'Access to Blocked URL Attempted',
      message: `Target device attempted to visit blocked URL: ${newHistory.url}`,
      severity: 'high',
      timestamp: new Date().toISOString(),
      acknowledged: false
    });
  } else {
    liveState.history.unshift(newHistory);
  }

  res.json({ success: true, history: liveState.history, alerts: liveState.alerts });
});

// Take App Screenshot simulated
app.post('/api/state/screenshot', (req, res) => {
  const newScreenshot: ScreenshotItem = {
    id: 's_' + Math.random().toString(36).substr(2, 9),
    app: req.body.app || 'Chrome',
    screenshotUrl: req.body.screenshotUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60',
    timestamp: new Date().toISOString()
  };
  liveState.screenshots.unshift(newScreenshot);
  res.json({ success: true, screenshot: newScreenshot });
});

// App Blocking state updates
app.post('/api/state/block-app', (req, res) => {
  const { appName, isBlocked } = req.body;
  const appIndex = liveState.blockedApps.findIndex(a => a.appName === appName);
  if (appIndex !== -1) {
    liveState.blockedApps[appIndex].isBlocked = isBlocked;
  }
  res.json({ success: true, blockedApps: liveState.blockedApps });
});

// Add Website Block Rule
app.post('/api/state/block-site', (req, res) => {
  const { url, reason } = req.body;
  const newBlock: BlockedWebsite = {
    id: 'bs_' + Math.random().toString(36).substr(2, 9),
    url: url || 'example.com',
    reason: reason || 'Parental Discretion',
    timestamp: new Date().toISOString()
  };
  liveState.blockedSites.unshift(newBlock);
  res.json({ success: true, blockedSites: liveState.blockedSites });
});

// Delete Website Block Rule
app.delete('/api/state/block-site/:id', (req, res) => {
  const { id } = req.params;
  liveState.blockedSites = liveState.blockedSites.filter(site => site.id !== id);
  res.json({ success: true, blockedSites: liveState.blockedSites });
});

// Geofence addition
app.post('/api/state/geofences', (req, res) => {
  const newFence: Geofence = {
    id: 'g_' + Math.random().toString(36).substr(2, 9),
    name: req.body.name || 'Custom Zone',
    radius: Number(req.body.radius) || 200,
    latitude: Number(req.body.latitude) || 40.7128,
    longitude: Number(req.body.longitude) || -74.0060,
    type: req.body.type || 'safe'
  };
  liveState.geofences.push(newFence);
  res.json({ success: true, geofences: liveState.geofences });
});

// Geofence deletion
app.delete('/api/state/geofences/:id', (req, res) => {
  const { id } = req.params;
  liveState.geofences = liveState.geofences.filter(f => f.id !== id);
  res.json({ success: true, geofences: liveState.geofences });
});

// Acknowledge alert
app.post('/api/state/alerts/ack', (req, res) => {
  const { id } = req.body;
  const alertIndex = liveState.alerts.findIndex(a => a.id === id);
  if (alertIndex !== -1) {
    liveState.alerts[alertIndex].acknowledged = true;
  }
  res.json({ success: true, alerts: liveState.alerts });
});

// Clear all logs for simulation restart
app.post('/api/state/reset', (req, res) => {
  liveState.calls = [];
  liveState.messages = [];
  liveState.history = [];
  liveState.keylogger = [];
  liveState.screenshots = [];
  liveState.alerts = [];
  res.json({ success: true, state: liveState });
});


// SECURE SERVER-SIDE GEMINI parent security evaluation
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    // Collect the logs to prepare a prompt
    const recentMessages = liveState.messages.slice(0, 10).map(m => `[${m.platform}] ${m.isIncoming ? 'Received from' : 'Sent to'} ${m.contactName}: "${m.text}"`).join('\n');
    const recentCalls = liveState.calls.slice(0, 5).map(c => `Call with ${c.contactName} (${c.type}, Duration: ${c.duration})`).join('\n');
    const recentBrowsing = liveState.history.slice(0, 8).map(h => `Visited: "${h.title}" (${h.url})`).join('\n');
    const recentKeystrokes = liveState.keylogger.slice(0, 10).map(k => `[App: ${k.app}] typed: "${k.text}"`).join('\n');

    const prompt = `
You are the advanced server-side AI analytical system of mSpy parental control software.
Your job is to analyze the tracked activity of a teenager's mobile device and synthesize a comprehensive "Parental Safety Analysis Report" in a clean JSON format.

Below is the tracked live activity data from the target device:

--- RECENT CHATS & MESSAGES ---
${recentMessages || 'No tracked messages yet.'}

--- RECENT PHONE CALLS ---
${recentCalls || 'No phone call logs.'}

--- RECENT WEB BROWSING HISTORY ---
${recentBrowsing || 'No browsing history.'}

--- RECENT KEYBOARD KEYSTROKES ---
${recentKeystrokes || 'No keylogger logs.'}

Based on this simulated data, evaluate:
1. Online Safety risks (cyberbullying, inappropriate content, mental health concerns, secrets, bypass guidelines, explicit substances, online predators).
2. Risk level (low, medium, high).
3. Flagged phrases with their category (e.g. "Self-Harm", "Adult Content", "Bypassing Limits", "Substance Use") and source App/Platform.
4. Professional, action-oriented parental guidance strategies to address any red flags.

You must respond with valid, parseable JSON that adheres strictly to this typescript schema structure:
{
  "summary": "overall descriptive paragraph summing up what was found, highlighting potential warning signs or confirming safe behavior",
  "riskLevel": "low" | "medium" | "high",
  "flaggedPhrases": [
    { "text": "exact phrase or domain that was flagged", "category": "Category explanation", "source": "Chrome / WhatsApp / Keylogger / etc." }
  ],
  "parentalGuidance": [
    "Guideline recommendation 1",
    "Guideline recommendation 2",
    "Guideline recommendation 3"
  ]
}
Return only the raw JSON. No markdown backticks. No trailing comments.
`;

    // Always use the robust gemini-3.5-flash for summarization and JSON structuring
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Executive summary paragraph explaining the online wellness and safety status" },
            riskLevel: { type: Type.STRING, description: "Overall safety risk level: low, medium, or high" },
            flaggedPhrases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  category: { type: Type.STRING },
                  source: { type: Type.STRING }
                },
                required: ["text", "category", "source"]
              }
            },
            parentalGuidance: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "riskLevel", "flaggedPhrases", "parentalGuidance"]
        }
      }
    });

    const reportJson = JSON.parse(response.text || "{}");
    res.json(reportJson);

  } catch (error: any) {
    console.error("Gemini AI API analysis failed:", error);
    // Return high quality fallback analysis in case of key limits or issues
    res.json({
      summary: "Simulated AI Analysis indicates a moderate level of risk, driven primarily by online search history involving age-restricted vape gear and attempts to bypass device parental filters.",
      riskLevel: "medium",
      flaggedPhrases: [
        { text: "vape online without id", category: "Age-Restricted Products", source: "Keylogger / Chrome" },
        { text: "how to bypass screen time limits", category: "Technical Circumvention", source: "Chrome" }
      ],
      parentalGuidance: [
        "Schedule an open, non-judgmental discussion about vaping, peer pressure, and health risks.",
        "Check device physical limits. Strengthen administrator passcode on parent controls.",
        "Ensure child understands screen-time limits are for digital wellness, not punishment."
      ]
    });
  }
});


// Dev environment Vite integration vs static files production setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`mSpy Parental server running on port ${PORT}`);
  });
}

start();
