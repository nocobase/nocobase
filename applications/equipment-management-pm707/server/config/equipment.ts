import { defineAppConfig, envString } from '@nocobase/app-server/config';
/** Dedicated native account passwords use the deployment's supported variable generator. */
export default defineAppConfig<{ samplePassword?: string }>({
  defaults: {},
  validate(value, context) {
    if (
      value.samplePassword !== undefined &&
      (typeof value.samplePassword !== 'string' ||
        value.samplePassword.length < 16)
    )
      context.error(
        'samplePassword',
        'The synthetic account password must contain at least 16 characters.',
      );
  },
  env: {
    EQUIPMENT_SAMPLE_PASSWORD: envString('samplePassword', {
      description:
        'Private password for the three synthetic equipment accounts; use at least 16 characters. Applied only during first-install sample provisioning.',
      required: false,
      secret: true,
      generate: 'password',
      firstStartOnly: true,
    }),
  },
});
