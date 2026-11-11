import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
// Resolve public package exports in the deployed App's dependency tree so service tokens share identity.
const deployment = new URL('../dist/package.json', import.meta.url).href;
const { identityProviderServiceToken } = await import(
  import.meta.resolve(
    '@nocobase/app-plugin-identity-provider/server',
    deployment,
  )
);
const { authorizationToken } = await import(
  import.meta.resolve('@nocobase/app-plugin-authorization/server', deployment)
);
const { userManagementServiceToken } = await import(
  import.meta.resolve('@nocobase/app-plugin-users/server', deployment)
);
const { releasesToken } = await import(
  import.meta.resolve('@nocobase/app-plugin-releases/server', deployment)
);
const { multiAppServiceToken } = await import(
  import.meta.resolve('@nocobase/app-plugin-multi-app/server', deployment)
);
const names = { reagents: '试剂管理' };
/** Called only from the locally controlled demo launcher, never exposed as an HTTP capability. */
export async function prepareDemo(app, plan) {
  const users = app.container.resolve(userManagementServiceToken),
    authz = app.container.resolve(authorizationToken),
    manager = app.container.resolve(multiAppServiceToken),
    releases = app.container.resolve(releasesToken);
  const username = app.config.get('users.initialAdmin.username') || 'nocobase',
    admins = await users.list({ search: username, pageSize: 100 }),
    admin = admins.items.find((user) => user.username === username);
  if (!admin) throw new Error('Initial administrator is missing.');
  const principal = { type: 'user', id: admin.id },
    subjects = await authz.subjects.resolveFor(principal),
    context = authz.for({ principal, subjects });
  if (!(await context.snapshot()).unrestricted)
    throw new Error(
      'Demo initialization requires the configured unrestricted administrator.',
    );
  const caller = await releases.callerForUser(admin.id),
    origin = app.config.get('app.publicOrigin'),
    environmentId = 'example-local';
  const environment = (await releases.environments.list(caller)).find(
    (item) => item.id === environmentId,
  );
  if (!environment)
    await releases.environments.create(caller, {
      id: environmentId,
      name: '本机 App Host',
      driver: 'host',
      config: { backend: 'in-process' },
      publicUrl: `${origin}/{appId}`,
      protected: false,
      purpose: 'test',
      maxApps: 50,
      sampleDataOnFirstDeploy: false,
    });
  const check = await releases.environments.check(caller, environmentId);
  if (!check.ok) throw new Error('App Host environment check failed.');
  const statePath = app.paths.storage('demo/setup.json');
  await mkdir(path.dirname(statePath), { recursive: true });
  let state = { keys: {} };
  try {
    state = JSON.parse(await readFile(statePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  async function key(label) {
    if (!state.keys[label]) {
      state.keys[label] = `${Date.now()}.${randomUUID()}`;
      await writeFile(statePath, JSON.stringify(state, null, 2));
    }
    return state.keys[label];
  }
  const templates = {};
  const versions = {};
  for (const [name, title] of Object.entries(names)) {
    let template = (
      await manager.list(context, 'templates', {
        q: title,
        page: 1,
        pageSize: 100,
      })
    ).data.find((item) => item.name === title);
    if (!template)
      template = (
        await manager.createTemplate(
          context,
          {
            name: title,
            description: `独立的${title}应用，可创建多个实例并分别升级。`,
            environmentId,
          },
          await key(`template:${name}`),
        )
      ).data;
    templates[name] = template;
    for (const { version, path: file } of plan.artifacts) {
      let published = (
        await manager.list(
          context,
          'versions',
          { q: version, page: 1, pageSize: 100 },
          template.id,
        )
      ).data.find((item) => item.version === version);
      if (!published) {
        const release = await manager.upload(
          context,
          template.id,
          createReadStream(file),
          await key(`upload:${name}:${version}`),
        );
        if (release.version !== version)
          throw new Error(
            `Archive version ${release.version} does not match supplied version ${version}; it has not been published.`,
          );
        published = (
          await manager.publish(
            context,
            template.id,
            release.id,
            await key(`publish:${name}:${version}`),
          )
        ).data;
      }
      versions[`${name}:${version}`] = published;
      console.log(`Ready: ${name}@${version}`);
    }
  }
  async function finish(operation) {
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      await manager.processPending();
      const current = await manager.get(context, 'operations', operation.id);
      if (current.status === 'succeeded') return;
      if (['failed', 'interrupted', 'cancelled'].includes(current.status))
        throw new Error(
          `Operation ${operation.id}: ${current.status} (${current.errorCode})`,
        );
      await delay(300);
    }
    throw new Error(
      `Operation ${operation.id} timed out; inspect management before retrying.`,
    );
  }
  for (const { id, name, version, stopped } of plan.instances) {
    const template = 'reagents';
    const existing = (
      await manager.list(context, 'instances', {
        q: '',
        page: 1,
        pageSize: 500,
      })
    ).data.find((item) => item.id === id);
    if (!existing) {
      const result = await manager.provision(
        context,
        {
          id,
          name,
          environmentId,
          versionId: versions[`${template}:${version}`].id,
        },
        await key(`instance:${id}`),
      );
      await finish(result.data);
      await app.container
        .resolve(identityProviderServiceToken)
        .setMember(id, admin.id, 'editor');
      if (stopped) {
        const instance = await manager.get(context, 'instances', id);
        await finish(
          (
            await manager.change(
              context,
              id,
              'stop',
              { expectedRevision: instance.revision, confirm: id },
              await key(`initial-stop:${id}`),
            )
          ).data,
        );
      }
    }
    console.log(`Ready: ${id}`);
  }
  // Existing instances and their selected versions/settings are deliberately retained on rerun.
  return { context, manager, releases, caller, templates, versions, finish };
}
