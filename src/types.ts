// Global TypeScript Types for mSpy Monitoring Panel

export interface DeviceInfo {
  model: string;
  os: string;
  battery: number;
  network: string;
  isOnline: boolean;
  gpsLatitude: number;
  gpsLongitude: number;
  storageUsed: number; // in GB
  storageTotal: number; // in GB
  lastUpdated: string;
}

export type CallType = 'incoming' | 'outgoing' | 'missed';

export interface CallLog {
  id: string;
  contactName: string;
  phoneNumber: string;
  type: CallType;
  timestamp: string;
  duration: string; // e.g. "02:45"
  recordingPlayable: boolean;
}

export type MessagePlatform = 'sms' | 'whatsapp' | 'messenger' | 'instagram' | 'snapchat' | 'viber' | 'tinder';

export interface MessageLog {
  id: string;
  platform: MessagePlatform;
  contactName: string;
  phoneNumber?: string;
  text: string;
  isIncoming: boolean;
  timestamp: string;
}

export interface BrowserHistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: string;
  visits: number;
}

export interface KeyloggerEvent {
  id: string;
  app: string;
  text: string;
  timestamp: string;
}

export interface ScreenshotItem {
  id: string;
  app: string;
  screenshotUrl: string;
  timestamp: string;
}

export interface Geofence {
  id: string;
  name: string;
  radius: number; // in meters
  latitude: number;
  longitude: number;
  type: 'safe' | 'restricted';
}

export interface SecurityAlert {
  id: string;
  type: 'bullying' | 'content' | 'geofence' | 'keystroke' | 'unusual';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  acknowledged: boolean;
}

export interface AppBlockState {
  appName: string;
  isBlocked: boolean;
  packageName: string;
  icon: string;
}

export interface BlockedWebsite {
  id: string;
  url: string;
  reason: string;
  timestamp: string;
}

export interface AiReport {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  flaggedPhrases: Array<{ text: string; category: string; source: string }>;
  parentalGuidance: string[];
  timestamp: string;
}

// Full State for mSpy
export interface MonitoringState {
  deviceInfo: DeviceInfo;
  calls: CallLog[];
  messages: MessageLog[];
  history: BrowserHistoryItem[];
  keylogger: KeyloggerEvent[];
  screenshots: ScreenshotItem[];
  geofences: Geofence[];
  alerts: SecurityAlert[];
  blockedApps: AppBlockState[];
  blockedSites: BlockedWebsite[];
}
