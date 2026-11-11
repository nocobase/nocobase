import { defineRealtimeConfig } from '@nocobase/app-server/realtime';

// Keep broker absent so an explicit broker without adapter fails validation.
export default defineRealtimeConfig();
