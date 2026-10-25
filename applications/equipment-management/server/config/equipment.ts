import { defineAppConfig, envString } from '@nocobase/app-server/config';
/** Optional synthetic account provisioning; supplied privately only for sample initialization. */
export default defineAppConfig<{ samplePassword?: string }>({
  defaults: {},
  env: {
    EQUIPMENT_SAMPLE_PASSWORD: envString('samplePassword', {
      description:
        'Private password for explicitly assigned synthetic equipment accounts.',
      required: false,
      secret: true,
    }),
  },
});
