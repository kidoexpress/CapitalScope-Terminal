// src/utils/marketHours.ts
// Determine if a stock exchange is currently open, based on local market time.

interface TradingSession {
  open: [number, number];   // [hour, minute] in local market time
  close: [number, number];
}

const SESSIONS: Record<string, TradingSession[]> = {
  US:  [{ open: [9, 30],  close: [16, 0]  }],
  BR:  [{ open: [10, 0],  close: [17, 55] }],
  UK:  [{ open: [8, 0],   close: [16, 30] }],
  DE:  [{ open: [9, 0],   close: [17, 30] }],
  FR:  [{ open: [9, 0],   close: [17, 30] }],
  JP:  [{ open: [9, 0],   close: [11, 30] }, { open: [12, 30], close: [15, 30] }],
  HK:  [{ open: [9, 30],  close: [12, 0]  }, { open: [13, 0],  close: [16, 0]  }],
};

const TIMEZONES: Record<string, string> = {
  US: 'America/New_York',
  BR: 'America/Sao_Paulo',
  UK: 'Europe/London',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  JP: 'Asia/Tokyo',
  HK: 'Asia/Hong_Kong',
};

export interface MarketStatus {
  isOpen: boolean;
  label: string;    // "Open" | "Closed" | "Weekend"
  color: string;
}

export function getMarketStatus(marketId: string): MarketStatus {
  const tz = TIMEZONES[marketId];
  const sessions = SESSIONS[marketId];
  if (!tz || !sessions) return { isOpen: false, label: 'Unknown', color: 'var(--text-lo)' };

  const now = new Date();
  const localStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const parts = Object.fromEntries(localStr.map(p => [p.type, p.value]));
  const weekday = parts.weekday;

  if (weekday === 'Sat' || weekday === 'Sun') {
    return { isOpen: false, label: 'Weekend', color: 'var(--text-lo)' };
  }

  const hour = parseInt(parts.hour === '24' ? '0' : parts.hour);
  const minute = parseInt(parts.minute);
  const totalMinutes = hour * 60 + minute;

  const isOpen = sessions.some(s => {
    const openMins  = s.open[0]  * 60 + s.open[1];
    const closeMins = s.close[0] * 60 + s.close[1];
    return totalMinutes >= openMins && totalMinutes < closeMins;
  });

  return isOpen
    ? { isOpen: true,  label: 'Open',   color: '#10b981' }
    : { isOpen: false, label: 'Closed', color: 'var(--text-lo)' };
}
