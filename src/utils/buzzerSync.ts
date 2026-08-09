// Real-time synchronization for 250+ audition participants and presenter screen
// Uses BroadcastChannel API for multi-tab / same-origin communication

export interface SyncMessage {
  type: 'BUZZER_STATE_UPDATE' | 'PRESS_BUZZER' | 'JOIN_CANDIDATE' | 'RESET_BUZZER';
  payload: any;
}

const CHANNEL_NAME = 'gyan_challenge_buzzer_channel';

class BuzzerSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(msg: SyncMessage) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.notify(event.data);
      };
    }
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(msg: SyncMessage) {
    this.listeners.forEach((listener) => listener(msg));
  }

  public send(msg: SyncMessage) {
    if (this.channel) {
      this.channel.postMessage(msg);
    }
    // Also notify local listeners in the same window context
    this.notify(msg);
  }
}

export const buzzerSync = new BuzzerSyncService();
