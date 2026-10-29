export interface WatchPartyPreferences {
    defaultPrivacy: 'public' | 'private';
    autoOpenChat: boolean;
    soundNotifications: boolean;
    nickname: string;
    autoSync: boolean;
}

const STORAGE_KEY = 'ajstreams_watchparty_prefs';

export const defaultPreferences: WatchPartyPreferences = {
    defaultPrivacy: 'public',
    autoOpenChat: true,
    soundNotifications: true,
    nickname: '',
    autoSync: true,
};

export function getWatchPartyPreferences(): WatchPartyPreferences {
    if (typeof window === 'undefined') return defaultPreferences;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return defaultPreferences;
        return { ...defaultPreferences, ...JSON.parse(stored) };
    } catch {
        return defaultPreferences;
    }
}

export function saveWatchPartyPreferences(prefs: Partial<WatchPartyPreferences>): WatchPartyPreferences {
    if (typeof window === 'undefined') return defaultPreferences;
    try {
        const current = getWatchPartyPreferences();
        const updated = { ...current, ...prefs };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('watchparty-prefs-changed', { detail: updated }));
        return updated;
    } catch {
        return defaultPreferences;
    }
}

export function playMessageChime() {
    if (typeof window === 'undefined') return;
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch {
        // AudioContext might be blocked until user gesture, ignore silently
    }
}
