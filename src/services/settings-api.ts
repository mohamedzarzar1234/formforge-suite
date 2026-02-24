import { APP_CONFIG } from '@/config';
import type { ApiResponse } from '@/types';

const delay = () => new Promise(r => setTimeout(r, APP_CONFIG.MOCK_DELAY));

export interface PredefinedSettings {
  sessions: string[];
}

let predefinedSettings: PredefinedSettings = {
  sessions: [
    'Session 1 - 08:00',
    'Session 2 - 09:00',
    'Session 3 - 10:00',
    'Session 4 - 11:00',
    'Session 5 - 13:00',
    'Session 6 - 14:00',
    'Session 7 - 15:00',
    'Session 8 - 16:00',
  ],
};

export const settingsApi = {
  getPredefined: async (): Promise<ApiResponse<PredefinedSettings>> => {
    await delay();
    return { data: { ...predefinedSettings, sessions: [...predefinedSettings.sessions] }, message: 'Success', success: true, statusCode: 200 };
  },
  updatePredefined: async (data: PredefinedSettings): Promise<ApiResponse<PredefinedSettings>> => {
    await delay();
    predefinedSettings = { ...data };
    return { data: { ...predefinedSettings }, message: 'Settings updated', success: true, statusCode: 200 };
  },
};

// Dynamic session options getter - used by attendance pages
export const getSessionOptions = (): string[] => predefinedSettings.sessions;
