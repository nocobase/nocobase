import '@/theme';
import { Application } from '@nocobase/client';
import { NoCoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';

const getCurrentTimezone = () => {
  const timezoneOffset = new Date().getTimezoneOffset() / -60;
  const timezone = String(timezoneOffset).padStart(2, '0') + ':00';
  return (timezoneOffset > 0 ? '+' : '-') + timezone;
};

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
    headers: {
      'X-Hostname': window?.location?.hostname,
      'X-Timezone': getCurrentTimezone(),
    },
  },
  plugins: [NoCoBaseClientPresetPlugin],
});

export default app.getRootComponent();
