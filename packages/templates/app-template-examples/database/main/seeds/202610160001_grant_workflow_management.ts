import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202610160001_grant_workflow_management',
  async run(context) {
    const client = await context.connection.client<{
      schema: { hasTable(name: string): Promise<boolean> };
    }>();
    if (!(await client.schema.hasTable('authorization_permission_sets')))
      return;
    const sets = context.repository('authorizationPermissionSets');
    const admin = await sets.findOne({
      filter: { key: 'system-administrator' },
    });
    if (!admin) return;
    const grants = (
      typeof admin.grants === 'string' ? JSON.parse(admin.grants) : admin.grants
    ) as Array<{
      resource: { type: string; id: string };
      actions: Array<{ action: string }>;
    }>;
    if (
      grants.some(
        (grant) =>
          grant.resource.type === 'settings' &&
          grant.resource.id === 'workflow-management',
      )
    )
      return;
    await sets.updateOne({
      filter: { key: 'system-administrator' },
      values: {
        grants: [
          ...grants,
          {
            resource: { type: 'settings', id: 'workflow-management' },
            actions: [{ action: 'read' }, { action: 'update' }],
          },
        ],
        updatedAt: new Date(),
      },
    });
  },
});
