/**
 * A real database for the service tests: a test database, with the authentication and authorization plugins'
 * migrations (the `user` collection and the permission-set tables) and then this plugin's migrations and seeds.
 */
import { createRequire } from 'node:module';
import path from 'node:path';

import {
  createAppAuthorization,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type {
  UserInvitation,
  UserInvitationResult,
} from '@nocobase/app-plugin-users/server/tokens';
import { createTestDatabase } from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';

import { permissionsOf, type Role } from './permissions.js';

export { permissionsOf, type Role };
import {
  BUILTIN_STATUSES,
  type WorkflowListItem,
} from '../shared/workflows.js';
import type { Viewer } from '../server/access/viewer.js';
import type { WorkflowTemplate } from '../server/domains/workflows/index.js';
import type { UserInvitations } from '../server/domains/invitations/index.js';
import type { PlanHooks } from '../server/domains/plans/index.js';
import type { IntakeOrganizer } from '../server/domains/plans/intake/index.js';
import {
  registerBusinesses,
  registerSettings,
} from '../server/providers/authorization.js';
import { createProjects, type Projects } from '../server/composition.js';
import { createAttachmentStorage } from '../server/domains/attachments/index.js';

const require = createRequire(import.meta.url);
const packageRoot = (name: string) =>
  path.dirname(require.resolve(`${name}/package.json`));
const ROOT = path.resolve(import.meta.dirname, '..');

/**
 * The user management plugin's invitations in memory: an address with an account (in the `user` table) is reported
 * back, any other gets a pending invitation. `accept` plays the plugin's acceptance: it creates the account and runs
 * this plugin's handler in one transaction.
 */
export interface FakeInvitations extends UserInvitations {
  readonly rows: UserInvitation[];
  accept(id: string, userId: string): Promise<void>;
}

export interface Harness {
  readonly database: DatabaseManager;
  readonly services: Projects;
  readonly authorization: AppAuthorization;
  readonly invitations: FakeInvitations;
  /** Users given the default role on becoming members, in order. */
  readonly admitted: string[];
  /** The administrators the application reports (approvers named `admin`). */
  readonly admins: string[];
  /** What hears plans being decided (`projectsPlanHooksToken`); set it in a test. */
  readonly planHooks: { current?: PlanHooks };
  /** Who organises intake with AI (`projectsIntakeOrganizerToken`); set it in a test. */
  readonly intakeOrganizer: { current?: IntakeOrganizer };
  /** The role `permissionsOfUser` reports per user (`member` when unset). */
  readonly roles: Map<string, Role>;
  /** Stored files' bytes by key: the file plugin and Drive, in memory. */
  readonly stored: Map<string, Uint8Array>;
  addUser(id: string, name?: string): Promise<string>;
  /**
   * Installs the test template `standard` ("Standard": the built-in statuses, people move freely, the system closes
   * merged work) as the default workflow, since the plugin ships none; returns it.
   */
  installStandardWorkflow(): Promise<WorkflowListItem>;
  viewer(userId: string, role?: Role): Viewer;
  close(): Promise<void>;
}

/** A default workflow for tests that need one: what the plugin's own default used to be. */
export const STANDARD_TEMPLATE: WorkflowTemplate = {
  key: 'standard',
  name: 'Standard',
  makeDefault: true,
  definition: {
    states: BUILTIN_STATUSES,
    transitions: [
      { from: '*', to: '*', actors: ['user'] },
      { from: '*', to: 'done', actors: ['system'] },
    ],
  },
};

export async function createHarness(): Promise<Harness> {
  const testDatabase = await createTestDatabase();
  const database = testDatabase.database;
  for (const [directory, packageName] of [
    [
      path.join(
        packageRoot('@nocobase/app-plugin-authentication'),
        'database/migrations',
      ),
      '@nocobase/app-plugin-authentication',
    ],
    [
      path.join(
        packageRoot('@nocobase/app-plugin-authorization'),
        'database/migrations',
      ),
      '@nocobase/app-plugin-authorization',
    ],
    [path.join(ROOT, 'database/migrations'), '@nocobase/app-plugin-projects'],
  ] as const)
    await database.createMigrator({ directory, packageName }).latest();
  await database
    .createSeeder({
      directory: path.join(ROOT, 'database/seeds'),
      packageName: '@nocobase/app-plugin-projects',
    })
    .run();

  let next = 0;
  const admitted: string[] = [];
  const admins: string[] = [];
  const planHooks: { current?: PlanHooks } = {};
  const intakeOrganizer: { current?: IntakeOrganizer } = {};
  const roles = new Map<string, Role>();
  const authorization = createAppAuthorization({
    connection: database.connection(),
  });
  registerSettings(authorization);
  registerBusinesses(authorization);
  const addUser = async (
    id: string,
    name = id,
    conn = database.connection(),
  ): Promise<string> => {
    const now = new Date();
    await conn.repository('user').createOne({
      values: {
        id,
        name,
        username: id,
        email: `${id}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
    return id;
  };
  const invitations = createFakeInvitations(database);
  const stored = new Map<string, Uint8Array>();
  const storage = createAttachmentStorage({
    disk: () => 'local',
    // The file plugin's upload, as far as the plugin uses it: the metadata row, and the bytes in memory.
    uploader: () => ({
      repository: (collection, options) => ({
        async uploadOne({ file }) {
          const id = crypto.randomUUID();
          const dot = file.name.lastIndexOf('.');
          const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : '';
          const key = `objects/${id}${ext ? `.${ext}` : ''}`;
          const now = new Date().toISOString();
          stored.set(key, new Uint8Array(await file.arrayBuffer()));
          await database
            .connection()
            .repository(collection)
            .createOne({
              values: {
                id,
                disk: options.disk,
                key,
                filename: file.name,
                ext,
                mimeType: file.type || 'application/octet-stream',
                size: file.size,
                ...options.policy.create.defaults,
                createdAt: now,
                updatedAt: now,
              },
            });
          return { record: { id } };
        },
      }),
    }),
    disks: () => ({
      // Drive's own method name, not a hook.
      // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
      use: () => ({
        getBytes: (key) => Promise.resolve(stored.get(key) ?? new Uint8Array()),
        getStream: async (key) => {
          const { Readable } = await import('node:stream');
          return Readable.from([Buffer.from(stored.get(key) ?? [])]);
        },
        delete: (key) => {
          stored.delete(key);
          return Promise.resolve();
        },
      }),
    }),
  });
  const services = createProjects({
    storage,
    basePath: () => '/app',
    database,
    idGenerator: { generateString: () => `id-${(next += 1)}` },
    // The application's side of roles, as Acme provides it; its own tests cover the real one.
    access: {
      permissionsOf: (identity) =>
        Promise.resolve(permissionsOf('member', identity.principal.id)),
      admit: (_conn, userId) => {
        admitted.push(userId);
        return Promise.resolve();
      },
      changed: () => Promise.resolve(),
      administrators: () => Promise.resolve([...admins]),
      permissionsOfUser: (userId) =>
        Promise.resolve(permissionsOf(roles.get(userId) ?? 'member', userId)),
    },
    invitations,
    planHooks: () => planHooks.current,
    intakeOrganizer: () => intakeOrganizer.current,
  });
  invitations.onAccepted = async (conn, row, userId) => {
    await addUser(userId, userId, conn);
    await services.invitations.accepted({
      connection: conn,
      invitationId: row.id,
      userId,
      email: row.email,
      createdAccount: true,
      data: row.data,
    });
  };

  return {
    database,
    services,
    authorization,
    invitations,
    admitted,
    admins,
    planHooks,
    intakeOrganizer,
    roles,
    stored,
    addUser: (id, name) => addUser(id, name),
    async installStandardWorkflow() {
      await services.workflows.installTemplate(STANDARD_TEMPLATE);
      const viewer = {
        userId: 'harness',
        actor: { type: 'user', id: 'harness' },
        permissions: permissionsOf('member', 'harness'),
      } as const;
      const workflow = (await services.workflows.list(viewer)).find(
        (item) => item.builtInKey === STANDARD_TEMPLATE.key,
      );
      if (!workflow) throw new Error('The standard workflow is missing.');
      return workflow;
    },
    viewer: (userId, role = 'member') => ({
      userId,
      actor: { type: 'user', id: userId },
      permissions: permissionsOf(role, userId),
    }),
    close: () => testDatabase.destroy(),
  };
}

function createFakeInvitations(database: DatabaseManager): FakeInvitations & {
  onAccepted?: (
    conn: ReturnType<DatabaseManager['connection']>,
    row: UserInvitation,
    userId: string,
  ) => Promise<void>;
} {
  const rows: UserInvitation[] = [];
  const fake: FakeInvitations & {
    onAccepted?: (
      conn: ReturnType<DatabaseManager['connection']>,
      row: UserInvitation,
      userId: string,
    ) => Promise<void>;
  } = {
    rows,
    async invite(input) {
      const results: UserInvitationResult[] = [];
      for (const email of input.emails) {
        const user = await database
          .connection()
          .repository<{ id: string; email: string }>('user')
          .findOne({ filter: { email } });
        if (user) {
          results.push({ email, outcome: 'existingUser', userId: user.id });
          continue;
        }
        const id = `invitation-${rows.length + 1}`;
        rows.push({
          id,
          email,
          status: 'pending',
          invitedBy: { id: input.invitedBy, name: input.invitedBy },
          roleScopes: {},
          data: input.data ?? {},
          summary: input.summary ?? [],
          expiresAt: '2099-01-01T00:00:00.000Z',
          sentAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        });
        results.push({
          email,
          outcome: 'invited',
          invitationId: id,
          emailSent: true,
        });
      }
      return results;
    },
    listInvitations: (input = {}) =>
      Promise.resolve(
        rows.filter(
          (row) =>
            row.status === 'pending' &&
            (!input.invitedBy || row.invitedBy.id === input.invitedBy),
        ),
      ),
    getInvitation: (id) => Promise.resolve(rows.find((row) => row.id === id)),
    resendInvitation: (id) => {
      const row = rows.find((item) => item.id === id);
      return Promise.resolve({
        email: row?.email ?? '',
        outcome: 'invited',
        invitationId: id,
        emailSent: false,
        inviteUrl: `https://example.test/invite/${id}`,
      });
    },
    revokeInvitation: (id) => {
      const index = rows.findIndex((row) => row.id === id);
      const row = rows[index];
      if (row) rows[index] = { ...row, status: 'revoked' };
      return Promise.resolve();
    },
    async accept(id, userId) {
      const index = rows.findIndex((row) => row.id === id);
      const row = rows[index];
      if (!row) throw new Error(`No invitation ${id}`);
      await database.transaction(async (conn) => {
        await fake.onAccepted?.(conn, row, userId);
      });
      rows[index] = { ...row, status: 'accepted' };
    },
  };
  return fake;
}
