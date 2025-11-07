export interface DashboardConfig {
  dashboardId: string;
  devices: Device[];
  emails: string[];
  crons: string[];
}

export interface Device {
  deviceId: string;
  name: string;
  keys: string[];
}

export interface Count {
  key: string;
  body: any;
}

export interface DeviceData extends Record<string, string | number | undefined> {
  name: string;
  deviceId: string;
}

export type DashboardConfigList = DashboardConfig[];