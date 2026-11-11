import {
  defineDatabasePermission,
  authorizationToken,
} from '@nocobase/app-plugin-authorization/server';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import { defineCompositeResource } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
export const labPermission = (action: string) => ({
  resource: { type: 'composite' as const, id: 'lab' },
  action,
});
const records = defineDatabasePermission((p) =>
  p.collection('labRecords').read('*'),
);
const settings = defineDatabasePermission((p) =>
  p.collection('labSettings').read('*'),
);
const resource = defineCompositeResource('lab', (r) =>
  r
    .title({ key: 'lab.records', ns: 'translation' })
    .action('read', (a) =>
      a
        .title({ key: 'lab.readAccess', ns: 'translation' })
        .grant('records', records)
        .grant('settings', settings),
    )
    .action('edit', (a) =>
      a
        .title({ key: 'lab.editAccess', ns: 'translation' })
        .grant(
          'records',
          records
            .create(['id', 'name', 'detail', 'location', 'createdAt'])
            .delete(),
        ),
    )
    .action('settings', (a) =>
      a
        .title({ key: 'lab.settings', ns: 'translation' })
        .grant(
          'settings',
          settings
            .create(['id', 'manager', 'location', 'revision'])
            .update(['manager', 'location', 'revision']),
        ),
    ),
);
export default class LabAccess extends ServiceProvider<Application> {
  readonly name = 'example/lab-access';
  override async boot(): Promise<void> {
    this.app.container
      .resolve(authorizationToken)
      .compositeResources.define(resource);
    await ensureRole(this.app, 'reader');
    await ensureRole(this.app, 'editor');
  }
}
async function ensureRole(app: Application, role: 'reader' | 'editor') {
  const authz = app.container.resolve(authorizationToken),
    sets = authz.permissionSets;
  const key = `platform-${role}`;
  if (!(await sets.get(key))) {
    let builder = definePermissionSet(key)
      .title({
        key: role === 'reader' ? 'lab.platformReader' : 'lab.platformEditor',
        ns: 'translation',
      })
      .grant({
        resource: { type: 'page', id: 'lab.records' },
        actions: [{ action: 'access' }],
      })
      .grant(
        resource
          .reference()
          .grant(
            role === 'reader'
              ? { read: {} }
              : { read: {}, edit: {}, settings: {} },
          ),
      );
    if (role === 'editor')
      builder = builder.grant({
        resource: { type: 'page', id: 'lab.settings' },
        actions: [{ action: 'access' }],
      });
    await sets.create(builder.build());
  }
}
export async function applyLabRole(
  app: Application,
  userId: string,
  role: 'reader' | 'editor',
) {
  const sets = app.container.resolve(authorizationToken).permissionSets,
    key = `platform-${role}`;
  const current = (await sets.listAssignments()).filter(
    (a) =>
      a.subject.type === 'user' &&
      a.subject.id === userId &&
      ['platform-reader', 'platform-editor'].includes(a.permissionSet),
  );
  if (current.length !== 1 || current[0]?.permissionSet !== key)
    await sets.replaceSubjectAssignments({
      subject: { type: 'user', id: userId },
      managedPermissionSets: ['platform-reader', 'platform-editor'],
      permissionSets: [key],
    });
}
