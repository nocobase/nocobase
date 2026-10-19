import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202610240051_web_push_subscriptions', {
  sources: [
    {
      packageName: '@nocobase/app-plugin-web-push',
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('webPushSubscriptions').toHaveIndex(['userId']);
    await expectCollection('webPushSubscriptions').toHaveIndex(
      ['endpointHash'],
      { unique: true },
    );
    await expectCollection('webPushSubscriptions').toHaveField(
      'subscriptionSealed',
      { type: 'text', nullable: false },
    );
  },
  down: async ({ expectCollection }) => {
    await expectCollection('webPushSubscriptions').not.toExist();
  },
});
