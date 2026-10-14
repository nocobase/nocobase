import { defineAppConfig, envInteger } from '@nocobase/app-server/config';

export default defineAppConfig({
  defaults: { agents: { managerIdleMinutes: 15 } },
  env: {
    STUDIO_MANAGER_IDLE_MINUTES: envInteger('agents.managerIdleMinutes', {
      description:
        'Minutes of idle waiting before the project manager is woken once; 15 by default, 0 disables it.',
    }),
  },
});
