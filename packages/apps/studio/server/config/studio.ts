import { defineAppConfig, envInteger } from '@nocobase/app-server/config';

export default defineAppConfig({
  defaults: { agents: { managerIdleMinutes: 15, managerIdleSweepMinutes: 5 } },
  env: {
    STUDIO_MANAGER_IDLE_SWEEP_MINUTES: envInteger(
      'agents.managerIdleSweepMinutes',
      {
        description:
          'Interval in minutes between manager idle checks; 5 by default, must be positive.',
      },
    ),
    STUDIO_MANAGER_IDLE_MINUTES: envInteger('agents.managerIdleMinutes', {
      description:
        'Idle timeout since the latest manager completion, in minutes; 15 by default, 0 disables recovery.',
    }),
  },
});
