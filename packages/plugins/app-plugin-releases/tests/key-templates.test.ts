// @vitest-environment node
import { createAppAuthorization } from '@nocobase/app-plugin-authorization';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';

import {
  registerBusinesses,
  registerCredentials,
} from '../server/providers/authorization.js';
import {
  HUMAN_ONLY_ACTIONS,
  KEY_SCOPE_GROUPS,
  KEY_SCOPE_PRESETS,
  KEY_TEMPLATES,
  RESOURCE_TYPE,
  levelActionsOf,
} from '../shared/access.js';

/** What a deprecated preset covers, as `<type>:<id>/<action>` with the action unleveled, and the businesses it picks. */
function presetAccess(id: string) {
  const preset = KEY_SCOPE_PRESETS.find((entry) => entry.id === id)!;
  const access = new Set<string>();
  const pick = new Set<string>();
  for (const [groupId, grant] of Object.entries(preset.groups)) {
    const group = KEY_SCOPE_GROUPS.find((entry) => entry.id === groupId)!;
    const levels = (['read', 'write', 'admin'] as const).slice(
      0,
      ['read', 'write', 'admin'].indexOf(grant.level) + 1,
    );
    for (const level of levels)
      for (const ref of group.levels[level] ?? [])
        access.add(
          ref.kind === 'page'
            ? `page:${ref.id}/access`
            : ref.kind === 'settings'
              ? `settings:${ref.id}/${ref.action}`
              : `${RESOURCE_TYPE}:${ref.id}/${ref.action}`,
        );
    if (grant.objects === 'pick' && group.objects)
      pick.add(group.objects.business);
  }
  return { access, pick };
}

function templateAccess(id: string) {
  const template = KEY_TEMPLATES.find((entry) => entry.id === id)!;
  const access = new Set<string>();
  const pick = new Set<string>();
  for (const grant of template.grants) {
    for (const action of grant.actions)
      access.add(`${grant.resource.type}:${grant.resource.id}/${action}`);
    if (grant.objects === 'pick') pick.add(grant.resource.id);
  }
  return { access, pick };
}

describe('API key templates and human-only actions', () => {
  it.each([
    ['ci-deploy', 'releases.ci-deploy'],
    ['ci-upload', 'releases.ci-upload'],
  ])(
    'gives with template %s exactly what the deprecated preset gives',
    (preset, template) => {
      expect(templateAccess(template)).toEqual(presetAccess(preset));
    },
  );

  it('marks every level of a person-only action and registers the templates and the Apps', async () => {
    const testDatabase = await createTestDatabase();
    try {
      const authz = createAppAuthorization({
        connection: testDatabase.database.connection(),
      });
      registerBusinesses(authz);
      const source = { list: () => Promise.resolve([]) };
      const remove = registerCredentials(authz, source);
      for (const action of HUMAN_ONLY_ACTIONS)
        for (const { name } of levelActionsOf(`rel.apps/${action}`))
          expect(
            authz.humanOnly({ type: RESOURCE_TYPE, id: 'rel.apps' }, name),
          ).toMatchObject({ ns: '@nocobase/app-plugin-releases' });
      expect(
        authz.humanOnly({ type: RESOURCE_TYPE, id: 'rel.apps' }, 'deploy.all'),
      ).toBeUndefined();
      expect(authz.credentials.templates.list().map((t) => t.id)).toEqual([
        'releases.ci-deploy',
        'releases.ci-upload',
      ]);
      expect(authz.credentials.objectSources.get('rel.apps')).toBe(source);
      remove();
      expect(authz.credentials.templates.list()).toEqual([]);
    } finally {
      await testDatabase.destroy();
    }
  });
});
