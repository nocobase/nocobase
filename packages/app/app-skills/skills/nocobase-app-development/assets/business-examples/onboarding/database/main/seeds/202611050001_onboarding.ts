import { randomUUID } from 'node:crypto';
import { defineSeed } from '@nocobase/db';
import metadata from '../../../package.json' with { type: 'json' };

export default defineSeed({
  name: '202611050001_onboarding',
  async run(context) {
    const client = await context.connection.client<{
      schema: { hasTable(name: string): Promise<boolean> };
    }>();
    if (!(await client.schema.hasTable('authorization_permission_sets')))
      return;
    for (const [key, action] of [
      ['onboarding-coordinator', 'coordinate'],
      ['onboarding-viewer', 'view'],
    ]) {
      const sets = context.repository('authorizationPermissionSets');
      if (!(await sets.findOne({ filter: { key } })))
        await sets.createOne({
          values: {
            id: randomUUID(),
            key,
            title: JSON.stringify({
              key:
                action === 'coordinate'
                  ? 'onboarding.coordinatorRole'
                  : 'onboarding.viewerRole',
              ns: metadata.name,
            }),
            grants: [
              {
                resource: { type: 'page', id: 'onboarding' },
                actions: [{ action: 'access' }],
              },
              {
                resource: { type: 'settings', id: 'onboarding' },
                actions: [{ action }],
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
    }
  },
});
