import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export interface TelemetryData {
  id: number;
  vehicleId: string;
  speed: number;
  fuelLevel: number;
  batteryLevel: number;
  mileage: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  maintenanceStatus: 'HEALTHY' | 'DUE' | 'CRITICAL';
  engineTemperature?: number;
  tirePressure?: number;
  alertMessage?: string;
}

class WebSocketService {
  private client: Client | null = null;
  private connected = false;

  connect(onTelemetryUpdate: (data: TelemetryData) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new SockJS('/ws-telemetry');
        this.client = new Client({
          webSocketFactory: () => socket,
          debug: (str) => {
            console.log('STOMP Debug:', str);
          },
          onConnect: () => {
            console.log('WebSocket connected');
            this.connected = true;
            
            // Subscribe to all telemetry updates
            this.client?.subscribe('/topic/telemetry', (message) => {
              const telemetryData: TelemetryData = JSON.parse(message.body);
              onTelemetryUpdate(telemetryData);
            });
            
            resolve();
          },
          onStompError: (frame) => {
            console.error('STOMP error:', frame);
            this.connected = false;
            reject(new Error('WebSocket connection failed'));
          },
          onWebSocketClose: () => {
            console.log('WebSocket connection closed');
            this.connected = false;
          },
        });

        this.client.activate();
      } catch (error) {
        console.error('WebSocket connection error:', error);
        reject(error);
      }
    });
  }

  subscribeToVehicle(vehicleId: string, onUpdate: (data: TelemetryData) => void): void {
    if (this.client && this.connected) {
      this.client.subscribe(`/topic/telemetry/${vehicleId}`, (message) => {
        const telemetryData: TelemetryData = JSON.parse(message.body);
        onUpdate(telemetryData);
      });
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const webSocketService = new WebSocketService();