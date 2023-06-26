import '@/theme';
import { Application } from '@nocobase/client';
import { NocoBaseClientPresetPlugin } from '@nocobase/preset-nocobase/client';

const getCurrentTimezone = () => {
  const timezoneOffset = new Date().getTimezoneOffset() / -60;
  const timezone = String(timezoneOffset).padStart(2, '0') + ':00';
  return (timezoneOffset > 0 ? '+' : '-') + timezone;
};

function getBasename() {
  const match = location.pathname.match(/^\/apps\/([^/]*)\//);
  return match ? match[0] : '/';
}

export const app = new Application({
  apiClient: {
    baseURL: process.env.API_BASE_URL,
    headers: {
      'X-Hostname': window?.location?.hostname,
      'X-Timezone': getCurrentTimezone(),
    },
  },
  router: {
    type: 'browser',
    basename: getBasename(),
  },
  plugins: [NocoBaseClientPresetPlugin],
});

export default app.getRootComponent();
