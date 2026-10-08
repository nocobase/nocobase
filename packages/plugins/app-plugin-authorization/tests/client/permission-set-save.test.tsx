// @vitest-environment jsdom
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import type { DatabaseManager } from '@nocobase/db';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Hono } from 'hono';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it } from 'vitest';

import type {
  AuthorizationOptionsResponse,
  PermissionSet,
} from '../../client/authorization-client.js';
import { localizeOptions } from '../../client/components/localized-options.js';
import { fromSet, toInput } from '../../client/pages/permission-sets/drafts.js';
import { PermissionSetEditor } from '../../client/pages/permission-sets/editor.js';
import {
  createAppAuthorization,
  defineDatabasePermission,
  type AppAuthorization,
} from '../../server/index.js';
import { condition } from '../../server/database/scope.js';
import permissionSetTables from '../../database/migrations/202608210001_create_permission_set_tables.js';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { migrationContext } from '../helpers/database-fixture.js';
import {
  createAuthorizationI18n,
  i18nWrapper,
  translate,
} from '../helpers/i18n.js';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import { json, mountedRouter } from '../helpers/mounted-router.js';

// The editor renders under this plugin's routes.
const wrapper = i18nWrapper(
  await createAuthorizationI18n(),
  AUTHORIZATION_NAMESPACE,
);

const projects = defineDatabasePermission((permission) =>
  permission
    .collection('projects')
    .title('Projects')
    .read(['id', 'ownerId', 'region', 'notes']),
);
const projectResource = defineCompositeResource('sales.projects', (resource) =>
  resource
    .title('Projects')
    .action('view', (action) =>
      action.title('View').grant('projects', projects),
    )
    .action('edit', (action) =>
      action
        .title('Edit project information')
        .grant('projects', projects.update(['notes'])),
    ),
);

let testDatabase: TestDatabase;
let database: DatabaseManager;
let authz: AppAuthorization;
let router: Hono;

beforeEach(async () => {
  testDatabase = await createTestDatabase();
  database = testDatabase.database;
  const connection = database.connection();
  await permissionSetTables.up(migrationContext(connection));
  await connection.builder.createCollection('projects', (table) => {
    table.string('id', { length: 64 }).primary();
    table.string('ownerId', { length: 64 });
    table.string('region', { length: 64 });
    table.string('notes', { length: 255 });
  });
  await connection.query
    .insertInto('projects')
    .values([
      { id: 'project-1', ownerId: 'alice', region: 'north', notes: '' },
      { id: 'project-2', ownerId: 'bob', region: 'north', notes: '' },
      { id: 'project-3', ownerId: 'bob', region: 'south', notes: '' },
    ])
    .execute();
  authz = createAppAuthorization({ connection, database });
  authz.database.collections.add({ name: 'projects', title: 'Projects' });
  authz.recordAccess.define(
    defineRecordAccess('regional', (access) =>
      access
        .title('My region')
        .collections('projects')
        .resolver(() => condition('region', '$eq', 'north')),
    ),
  );
  authz.ui.sections.add({ name: 'sales', title: 'Sales', parent: 'business' });
  authz.ui.place(authz.compositeResources.define(projectResource), {
    section: 'sales',
  });
  await authz.permissionSets.create({ key: 'root', grants: [] });
  await authz.permissionSets.assign({
    subject: { type: 'user', id: 'admin' },
    permissionSet: 'root',
  });
  await authz.permissionSets.create({
    key: 'assistant',
    title: 'Assistant',
    grants: [
      projectResource.reference().grant({ view: { projects: 'allRecords' } }),
    ],
  });
  await authz.permissionSets.assign({
    subject: { type: 'user', id: 'alice' },
    permissionSet: 'assistant',
  });
  router = await mountedRouter(authz);
});

afterEach(async () => {
  await testDatabase.destroy();
});

it('saves one operation scope from the editor through the HTTP route without changing the other operation', async () => {
  const raw = (
    await (
      await router.request('/api/authorization/permissionSets/options')
    ).json()
  ).data as AuthorizationOptionsResponse;
  const options = localizeOptions(raw, translate);
  const set = (await authz.permissionSets.get('assistant')) as PermissionSet;
  let saved = false;
  function Editor() {
    const [draft, setDraft] = useState(() => fromSet(set));
    return (
      <MemoryRouter>
        <PermissionSetEditor
          dirty={true}
          options={options}
          draft={draft}
          busy={false}
          onChange={setDraft}
          onClose={() => {}}
          onSave={async (event) => {
            event.preventDefault();
            const response = await router.request(
              `/api/authorization/permissionSets/${set.key}`,
              json('PATCH', toInput(draft)),
            );
            expect(response.status).toBe(200);
            saved = true;
          }}
        />
      </MemoryRouter>
    );
  }
  render(<Editor />, { wrapper });
  // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
  await userEvent.click(
    screen.getByRole('button', { name: 'Projects: Edit project information' }),
  );
  fireEvent.click(
    await screen.findByRole('radio', {
      name: 'Configure permission',
      exact: true,
    }),
  );
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Specify scope: Projects' }),
  );
  await userEvent.click(screen.getByRole('combobox', { name: 'Projects' }));
  const region = await screen.findByRole('option', { name: 'My region' });
  fireEvent.pointerDown(region, { pointerType: 'mouse' });
  fireEvent.mouseUp(region);
  fireEvent.click(region);
  fireEvent.click(screen.getByRole('button', { name: 'Back to resources' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save permission set' }));
  await waitFor(() => expect(saved).toBe(true));

  expect(
    (await authz.permissionSets.get('assistant'))?.grants[0]?.actions,
  ).toEqual([
    {
      action: 'view',
      policy: { type: 'composite', scopes: { projects: 'allRecords' } },
    },
    {
      action: 'edit',
      policy: { type: 'composite', scopes: { projects: 'regional' } },
    },
  ]);
  const alice = authz.for({ principal: { type: 'user', id: 'alice' } });
  const editable = database
    .repository('projects')
    .withPolicy(await authz.database.policyFor('projects', alice));
  expect((await editable.findMany()).map((row) => row.id)).toEqual([
    'project-1',
    'project-2',
    'project-3',
  ]);
  await editable.updateOne({
    filter: { id: 'project-2' },
    values: { notes: 'Regional edit' },
  });
  await expect(
    editable.updateOne({
      filter: { id: 'project-3' },
      values: { notes: 'Outside the region' },
    }),
  ).rejects.toMatchObject({ code: 'RECORD_NOT_FOUND' });
});
