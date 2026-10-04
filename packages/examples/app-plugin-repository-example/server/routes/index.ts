import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  defineApiRoutes,
  defineRepositoryApiRoutes,
  type AppApiRouteContribution,
  type RepositoryApiActions,
  type RepositoryApiExposure,
} from '@nocobase/app-server/router';
import { buildRepositoryPolicy, type RepositoryPolicy } from '@nocobase/db';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { Hono } from 'hono';

const actions: RepositoryApiActions = {
  findMany: { maxLimit: 100 },
  findOne: {},
  count: {},
  aggregate: {},
  groupBy: {},
  exists: {},
  createOne: {},
  updateOne: {},
  deleteOne: {},
};
const relationActions: RepositoryApiActions = {
  findMany: { maxLimit: 100 },
  findOne: {},
  createOne: {},
  updateOne: {},
};

/**
 * Read whatever the sample data holds, write only the named fields.
 *
 * This example uses a shared workspace, so nothing here is scoped to a
 * principal. A real application declares `policy` as a function of one and
 * gives the scopes that keep each caller to their own rows.
 */
function fieldsPolicy(
  create: readonly string[],
  update: readonly string[],
  remove: boolean = true,
): RepositoryPolicy {
  return {
    read: true,
    create: { scope: true, fields: create },
    update: { scope: true, fields: update },
    delete: remove ? true : false,
  };
}

const repositories: readonly RepositoryApiExposure[] = [
  {
    name: 'repositoryExampleCustomers',
    policy: fieldsPolicy(
      ['id', 'name', 'company', 'email', 'status'],
      ['name', 'company', 'email', 'status'],
    ),
    actions,
  },
  {
    name: 'repositoryExampleContacts',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) =>
          create
            .scope(true)
            .fields('id', 'name', 'email', 'phone')
            .relation('customer', (customer) => customer.connect()),
        )
        .update((update) =>
          update
            .scope(true)
            .fields('name', 'email', 'phone')
            .relation('customer', (customer) => customer.connect()),
        )
        .delete(true),
    ),
    actions,
  },
  {
    name: 'repositoryExampleProducts',
    policy: fieldsPolicy(
      ['id', 'name', 'sku', 'unitPriceCents'],
      ['name', 'sku', 'unitPriceCents'],
    ),
    actions,
  },
  {
    name: 'repositoryExampleOrders',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) =>
          create
            .scope(true)
            .fields('id', 'number', 'status')
            .relation('customer', (customer) => customer.connect())
            .relation('items', (items) =>
              items.create((item) =>
                item
                  .fields('id', 'quantity', 'unitPriceCents')
                  .relation('product', (product) => product.connect()),
              ),
            ),
        )
        .update((update) =>
          update
            .scope(true)
            .fields('number', 'status')
            .relation('customer', (customer) => customer.connect()),
        )
        .delete(true),
    ),
    actions,
  },
  {
    name: 'repositoryExampleOrderItems',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) =>
          create
            .scope(true)
            .fields('id', 'quantity', 'unitPriceCents')
            .relation('order', (order) => order.connect())
            .relation('product', (product) => product.connect()),
        )
        .update((update) =>
          update
            .scope(true)
            .fields('quantity', 'unitPriceCents')
            .relation('order', (order) => order.connect())
            .relation('product', (product) => product.connect()),
        )
        .delete(true),
    ),
    actions,
  },
  {
    name: 'repositoryExampleAtomicCounters',
    policy: fieldsPolicy(['id', 'name', 'value'], ['name', 'value']),
    actions,
  },
  {
    name: 'repositoryExampleRelationUsers',
    policy: fieldsPolicy(['id', 'name', 'email'], ['name', 'email'], false),
    actions: relationActions,
  },
  {
    name: 'repositoryExampleRelationProjectProfiles',
    policy: fieldsPolicy(['id', 'summary'], ['summary'], false),
    actions: relationActions,
  },
  {
    name: 'repositoryExampleRelationTasks',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) =>
          create
            .scope(true)
            .fields('id', 'title', 'status', 'points')
            .relation('assignee', (assignee) => assignee.connect()),
        )
        .update((update) =>
          update.scope(true).fields('title', 'status', 'points'),
        ),
    ),
    actions: relationActions,
  },
  {
    name: 'repositoryExampleRelationTags',
    policy: fieldsPolicy(['id', 'label'], ['label'], false),
    actions: relationActions,
  },
  {
    name: 'repositoryExampleRelationProjectTags',
    policy: fieldsPolicy(['projectId', 'tagId', 'role'], ['role'], false),
    actions: relationActions,
  },
  {
    name: 'repositoryExampleRelationProjects',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) =>
          create
            .scope(true)
            .fields('id', 'name', 'status')
            .relation('owner', (owner) => owner.connect())
            .relation('profile', (profile) =>
              profile.create((values) => values.fields('id', 'summary')),
            )
            .relation('tasks', (tasks) =>
              tasks.create((task) =>
                task
                  .fields('id', 'title', 'status', 'points')
                  .relation('assignee', (assignee) => assignee.connect()),
              ),
            )
            .relation('tags', (tags) =>
              tags.connect((edge) =>
                edge.through((through) => through.fields('role')),
              ),
            ),
        )
        .update((update) =>
          update
            .scope(true)
            .fields('name', 'status')
            .relation('owner', (owner) => owner.connect())
            .relation('profile', (profile) =>
              profile
                .create((values) => values.fields('id', 'summary'))
                .connect()
                .disconnect()
                .update((values) => values.fields('summary'))
                .upsert((branches) =>
                  branches
                    .create((values) => values.fields('id', 'summary'))
                    .update((values) => values.fields('summary')),
                )
                .delete(),
            )
            .relation('tasks', (tasks) =>
              tasks
                .create((task) =>
                  task.fields('id', 'title', 'status', 'points'),
                )
                .connect()
                .disconnect()
                .set()
                .update((task) => task.fields('title', 'status', 'points'))
                .upsert((branches) =>
                  branches
                    .create((task) =>
                      task.fields('id', 'title', 'status', 'points'),
                    )
                    .update((task) => task.fields('title', 'status', 'points')),
                )
                .delete(),
            )
            .relation('tags', (tags) =>
              tags
                .create((tag) =>
                  tag
                    .fields('id', 'label')
                    .through((through) => through.fields('role')),
                )
                .connect((edge) =>
                  edge.through((through) => through.fields('role')),
                )
                .set((edge) =>
                  edge.through((through) => through.fields('role')),
                )
                .disconnect()
                .update((tag) => tag.fields('label'))
                .upsert((branches) =>
                  branches
                    .create((tag) => tag.fields('id', 'label'))
                    .update((tag) => tag.fields('label')),
                )
                .delete(),
            ),
        ),
    ),
    actions: relationActions,
  },
  {
    name: 'repositoryExampleFindManyRecords',
    policy: { read: true, create: false, update: false, delete: false },
    actions: { findMany: { maxLimit: 100 } },
  },
];
const repositoryRoutes = defineRepositoryApiRoutes({ repositories });

// This example uses a shared workspace: every signed-in user can manage its
// sample records. Guard each owned endpoint; unrelated contributions stay untouched.
export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(async (app) => {
    const router = new Hono();
    const authentication = app.container.resolve(authenticationToken);
    for (const { name, actions: enabledActions } of repositories)
      for (const action of Object.keys(enabledActions))
        router.use(`/${name}/${action}`, authentication.required());
    router.route('/', await repositoryRoutes.createRouter(app));
    return router;
  });
const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];
export default routes;
