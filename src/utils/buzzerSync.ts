// Real-time synchronization for audition participants and presenter screen
// Multi-device sync over MQTT WebSockets + local BroadcastChannel fallback

import mqtt, { type MqttClient } from 'mqtt';

export interface SyncMessage {
  msgId?: string;
  type: 'BUZZER_STATE_UPDATE' | 'PRESS_BUZZER' | 'JOIN_CANDIDATE' | 'RESET_BUZZER';
  payload: any;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'offline';

const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8000/mqtt',
  'wss://test.mosquitto.org:8081',
];

export function getInitialRoomCode(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const code = roomParam.trim().toUpperCase();
      localStorage.setItem('gyan_buzzer_room_code', code);
      return code;
    }
    const stored = localStorage.getItem('gyan_buzzer_room_code');
    if (stored) return stored;
  }
  return 'GYAN-LIVE';
}

class BuzzerSyncService {
  private channel: BroadcastChannel | null = null;
  private mqttClient: MqttClient | null = null;
  private roomCode: string = 'GYAN-LIVE';
  private listeners: Array<(msg: SyncMessage) => void> = [];
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private connectionStatus: ConnectionStatus = 'connecting';
  private seenMsgIds = new Set<string>();
  private currentBrokerIndex = 0;
  private myClientId: string = '';

  constructor() {
    this.myClientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.roomCode = getInitialRoomCode();
    this.initBroadcastChannel();
    this.initMqtt();
  }

  public setRoomCode(code: string) {
    const cleanCode = code.trim().toUpperCase() || 'GYAN-LIVE';
    if (this.roomCode === cleanCode) return;
    
    // Unsubscribe from old topic
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.unsubscribe(`gyan-challenge/room/${this.roomCode}`);
    }

    this.roomCode = cleanCode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gyan_buzzer_room_code', cleanCode);
    }

    this.initBroadcastChannel();

    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.subscribe(`gyan-challenge/room/${this.roomCode}`, { qos: 1 });
    }
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  private setStatus(status: ConnectionStatus) {
    if (this.connectionStatus === status) return;
    this.connectionStatus = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.connectionStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      if (this.channel) {
        try { this.channel.close(); } catch (e) {}
      }
      const channelName = `gyan_challenge_buzzer_channel_${this.roomCode}`;
      this.channel = new BroadcastChannel(channelName);
      this.channel.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };
    }
  }

  private initMqtt() {
    if (typeof window === 'undefined') return;

    const brokerUrl = BROKERS[this.currentBrokerIndex];
    this.setStatus('connecting');

    try {
      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId: `${this.myClientId}_${Math.random().toString(36).substring(2, 5)}`,
        keepalive: 30,
        reconnectPeriod: 3000,
        connectTimeout: 7000,
        clean: true,
      });

      this.mqttClient.on('connect', () => {
        this.setStatus('connected');
        this.mqttClient?.subscribe(`gyan-challenge/room/${this.roomCode}`, { qos: 1 });
      });

      this.mqttClient.on('message', (_topic, message) => {
        try {
          const msg: SyncMessage = JSON.parse(message.toString());
          this.handleIncomingMessage(msg);
        } catch (e) {
          console.error('[BuzzerSync] Failed to parse MQTT message:', e);
        }
      });

      this.mqttClient.on('error', (err) => {
        console.warn(`[BuzzerSync] MQTT Broker ${brokerUrl} error:`, err);
        this.switchBroker();
      });

      this.mqttClient.on('offline', () => {
        this.setStatus('connecting');
      });

      this.mqttClient.on('close', () => {
        this.setStatus('connecting');
      });
    } catch (err) {
      console.error('[BuzzerSync] MQTT setup error:', err);
      this.switchBroker();
    }
  }

  private switchBroker() {
    if (this.mqttClient) {
      try { this.mqttClient.end(true); } catch (e) {}
    }
    this.currentBrokerIndex = (this.currentBrokerIndex + 1) % BROKERS.length;
    setTimeout(() => {
      this.initMqtt();
    }, 2000);
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private handleIncomingMessage(msg: SyncMessage) {
    if (!msg || !msg.type) return;

    // Deduplicate messages using msgId
    if (msg.msgId) {
      if (this.seenMsgIds.has(msg.msgId)) return;
      this.seenMsgIds.add(msg.msgId);
      // Keep seen set small
      if (this.seenMsgIds.size > 200) {
        const first = Array.from(this.seenMsgIds)[0];
        this.seenMsgIds.delete(first);
      }
    }

    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (e) {
        console.error('[BuzzerSync] Listener error:', e);
      }
    });
  }

  public send(msg: SyncMessage) {
    const fullMsg: SyncMessage = {
      ...msg,
      msgId: msg.msgId || `${this.myClientId}_${msg.type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    // Mark as seen locally to prevent duplicate loopback handling
    if (fullMsg.msgId) {
      this.seenMsgIds.add(fullMsg.msgId);
    }

    // 1. Post to local BroadcastChannel (same browser tabs)
    if (this.channel) {
      try {
        this.channel.postMessage(fullMsg);
      } catch (e) {}
    }

    // 2. Publish to MQTT topic (multi-device over internet)
    if (this.mqttClient && this.mqttClient.connected) {
      try {
        this.mqttClient.publish(
          `gyan-challenge/room/${this.roomCode}`,
          JSON.stringify(fullMsg),
          { qos: 1 }
        );
      } catch (e) {
        console.error('[BuzzerSync] MQTT publish error:', e);
      }
    }

    // 3. Notify local listeners in the current tab context
    this.listeners.forEach((listener) => {
      try {
        listener(fullMsg);
      } catch (e) {}
    });
  }
}

export const buzzerSync = new BuzzerSyncService();
