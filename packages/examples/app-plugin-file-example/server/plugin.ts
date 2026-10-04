import path from 'node:path';

import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  defineApiRoutes,
  defineRepositoryApiRoutes,
  type AppApiRouteContribution,
  type RepositoryApiExposure,
} from '@nocobase/app-server/router';
import {
  defineServerPlugin,
  type AppPluginApplication,
  type AppServerPlugin,
} from '@nocobase/app-server/plugins';
import {
  defineFileRepositoryApiRoutes,
  type FileRepositoryApiActions,
} from '@nocobase/app-plugin-file/server';
import { buildRepositoryPolicy, type RepositoryPolicy } from '@nocobase/db';
import { Hono } from 'hono';

const fileActions: FileRepositoryApiActions = {
  findMany: {},
  findOne: {},
  count: {},
  exists: {},
  deleteOne: {},
  uploadOne: {},
  uploadMany: {},
};

/**
 * Uploading and removing metadata, but no caller-supplied file record.
 *
 * `create` is a node rather than `false` because an upload is a create: the
 * empty allowlist refuses a client-written row while the upload path, which
 * supplies no caller fields at all, still works.
 */
const filePolicy: RepositoryPolicy = {
  read: true,
  create: { scope: true },
  update: false,
  delete: true,
};

// Three file collections share the same File Repository implementation: the
// flat attachments demo, one profile avatar (one-to-one) and many order
// attachments (one-to-many).
const fileRepositories = [
  {
    name: 'attachments',
    collection: 'attachments',
    connection: 'main',
    disk: 'local',
    accessPath: '/uploads/attachments',
    accessMode: 'stream',
    policy: filePolicy,
    actions: fileActions,
  },
  {
    name: 'profileAvatars',
    collection: 'fileExampleProfileAvatars',
    connection: 'main',
    disk: 'local',
    accessPath: '/uploads/profile-avatars',
    accessMode: 'stream',
    policy: filePolicy,
    actions: fileActions,
  },
  {
    name: 'orderAttachments',
    collection: 'fileExampleOrderAttachments',
    connection: 'main',
    disk: 'local',
    accessPath: '/uploads/order-attachments',
    accessMode: 'stream',
    policy: filePolicy,
    actions: fileActions,
  },
] as const;
const fileRoutes = defineFileRepositoryApiRoutes({
  repositories: fileRepositories,
});

// Business repositories own the relations. Clients upload through the file
// repositories and then connect the returned record here.
const businessRepositories: readonly RepositoryApiExposure[] = [
  {
    name: 'fileExampleProfiles',
    policy: buildRepositoryPolicy((policy) =>
      policy.read(true).update((update) =>
        update
          .scope(true)
          .fields('name', 'jobTitle')
          .relation('avatar', (avatar) => avatar.connect().disconnect()),
      ),
    ),
    actions: {
      findMany: { maxLimit: 100 },
      findOne: {},
      updateOne: {},
    },
  },
  {
    name: 'fileExampleOrders',
    policy: buildRepositoryPolicy((policy) =>
      policy.read(true).update((update) =>
        update
          .scope(true)
          .fields('number', 'customerName', 'status', 'amountCents')
          .relation('attachments', (attachments) =>
            attachments.connect().disconnect(),
          ),
      ),
    ),
    actions: {
      findMany: { maxLimit: 100 },
      findOne: {},
      updateOne: {},
    },
  },
];

const businessRoutes = defineRepositoryApiRoutes({
  repositories: businessRepositories,
});

// The File Repository builds no authentication of its own. This example is a
// shared workspace: every signed-in user may upload, read and remove its files
// and edit its sample records, and an anonymous caller may do none of it. Each
// owned endpoint is guarded on the exact path it answers, uploads included, so
// the check runs before the Policy, the body limit and the multipart body. The
// content route under each `accessPath` stays public: it serves whoever holds
// the record's UUID, which is the File Repository's documented contract.
const exposures: readonly { name: string; actions: object }[] = [
  ...fileRepositories,
  ...businessRepositories,
];
const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(async (app: AppPluginApplication) => {
    const router = new Hono();
    const authentication = app.container.resolve(authenticationToken);
    for (const { name, actions } of exposures)
      for (const action of Object.keys(actions))
        router.use(`/${name}/${action}`, authentication.required());
    for (const route of fileRoutes)
      if (route.scope === 'api')
        router.route('/', await route.createRouter(app));
    router.route('/', await businessRoutes.createRouter(app));
    return router;
  });

const plugin: AppServerPlugin = defineServerPlugin({
  baseDir: path.resolve(import.meta.dirname, '..'),
  packageName: '@nocobase/app-plugin-file-example',
  database: {
    migrations: './database/migrations',
    seeds: './database/seeds',
  },
  routes: [apiRoutes, ...fileRoutes.filter((route) => route.scope !== 'api')],
});
export default plugin;
