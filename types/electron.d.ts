export interface ScreenTimeApp {
  name: string;
  seconds: number;
}

export interface ScreenTimeStats {
  date?: string;
  totalSeconds: number;
  totalFormatted: string;
  apps: ScreenTimeApp[];
  allStats?: Record<string, ScreenTimeStats>;
}

declare global {
  interface Window {
    electronAPI?: {
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, args: any) => void;
    };
  }
}
