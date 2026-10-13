/** A built Studio with local persisted preview fixtures and a real in-process preview App. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Readable } from 'node:stream';
import process from 'node:process';
import { setTimeout } from 'node:timers';

const dist = path.resolve(import.meta.dirname, '../../dist');
// Resolve public ESM exports from the deployment so the fixture shares its service tokens.
const load = (name) =>
  import(
    import.meta.resolve(
      name,
      pathToFileURL(path.join(dist, 'package.json')).href,
    )
  );
const { createStandaloneServer } = await import(
  pathToFileURL(path.join(dist, 'server/standalone.js')).href
);
const { startNodeAppServer } = await load('@nocobase/app-server/node');
const { databaseManagerToken } = await load('@nocobase/db');
const { projectsToken, projectsAccessToken } = await load(
  '@nocobase/app-plugin-projects/server/tokens',
);
const { releasesToken } = await load(
  '@nocobase/app-plugin-releases/server/tokens',
);
const { SYSTEM_CALLER } = await load('@nocobase/app-plugin-releases/server');
const { create: createTar } = await load('tar');
const store = await import(
  pathToFileURL(path.join(dist, 'server/git/store.js')).href
);
const { insertPreview, updatePreview } = await import(
  pathToFileURL(path.join(dist, 'server/previews/store.js')).href
);
const server = await createStandaloneServer();
await startNodeAppServer(server, server.listenOptions);
const container = server.application.container;
const conn = container.resolve(databaseManagerToken).connection();
// Demo creation is asynchronous. Its user is synthetic and contains no personal data.
let user;
for (let attempt = 0; attempt < 180 && !user; attempt++) {
  user = await conn.query
    .selectFrom('user')
    .select('id')
    .where('email', '=', 'alex@example.com')
    .executeTakeFirst();
  if (!user) await new Promise((resolve) => setTimeout(resolve, 500));
}
if (!user) throw new Error('Preview fixture user was not installed.');
const projects = container.resolve(projectsToken);
const access = container.resolve(projectsAccessToken);
const viewer = {
  userId: String(user.id),
  actor: { type: 'user', id: String(user.id) },
  permissions: await access.permissionsOfUser(String(user.id)),
};
const project = await projects.projects.create(viewer, {
  name: 'Repository preview cleanup',
  visibility: 'everyone',
});
const repoName = 'example-team/preview-cleanup';
const resource = await projects.projects.addResource(viewer, project.id, {
  type: 'gitRepo',
  url: `https://github.com/${repoName}.git`,
  binding: {
    provider: 'github',
    connectionId: 'local-preview-fixture',
    repoId: 'pm5-local-repo',
    fullName: repoName,
  },
});
const repo = await store.ensureRepo(conn, 'https://api.github.com', repoName);
await store.updateRepo(conn, repo.id, {
  provider: 'github',
  connectionId: 'local-preview-fixture',
  externalId: 'pm5-local-repo',
});
const { pr } = await store.upsertPullRequest(conn, repo.id, {
  repo: repoName,
  number: 7,
  url: `https://github.com/${repoName}/pull/7`,
  title: 'Manual pull request preview cleanup',
  body: null,
  state: 'open',
  draft: false,
  headRef: 'manual-preview',
  baseRef: 'main',
  headSha: 'a'.repeat(40),
  authorLogin: 'example-team',
  mergeableState: null,
  mergedAt: null,
  mergedByLogin: null,
  mergeCommitSha: null,
  closedAt: null,
});
const releases = container.resolve(releasesToken);
const caller = { ...SYSTEM_CALLER, userId: viewer.userId };
await releases.releases.createApp(caller, {
  id: 'pm5-target',
  name: 'Manual preview target application',
  environmentId: 'preview',
});
await releases.releases.createApp(caller, {
  id: 'pm5-preview',
  name: 'Manual pull request preview',
  environmentId: 'preview',
  labels: { studio: 'preview' },
});
const source = path.join(process.env.APP_STORAGE_DIR, 'fixture-source');
await mkdir(path.join(source, 'dist/server'), { recursive: true });
await writeFile(
  path.join(source, 'package.json'),
  JSON.stringify({
    name: '@example/preview',
    version: '1.0.0',
    type: 'module',
  }),
);
await writeFile(
  path.join(source, 'dist/server/embedded.js'),
  'export function createServer() { return { fetch() { return new Response("PM-5 local preview fixture"); } }; }',
);
const archive = path.join(source, 'preview.tar.gz');
await createTar({ cwd: source, file: archive, gzip: true, portable: true }, [
  'package.json',
  'dist/server/embedded.js',
]);
const release = await releases.releases.uploadRelease(caller, 'pm5-preview', {
  stream: Readable.from([await readFile(archive)]),
});
const deployment = await releases.releases.deploy(caller, 'pm5-preview', {
  releaseId: release.id,
});
const finished = await releases.releases.waitForDeployment(
  deployment.id,
  120_000,
);
if (finished.status !== 'succeeded')
  throw new Error(`Preview fixture deployment failed: ${finished.status}`);
await insertPreview(conn, {
  id: 'pm5-local-preview',
  resourceId: resource.id,
  pullRequestId: pr.id,
  repo: repoName,
  number: 7,
  appId: 'pm5-preview',
  targetAppId: 'pm5-target',
  environmentId: 'preview',
  status: 'ready',
  createdBy: viewer.userId,
  createdAt: new Date(),
  updatedAt: new Date(),
});
await updatePreview(conn, 'pm5-local-preview', {
  releaseId: release.id,
  deploymentId: deployment.id,
  deployedSha: 'a'.repeat(40),
});
await writeFile(
  path.join(process.env.APP_STORAGE_DIR, '../preview-fixture.json'),
  JSON.stringify({
    projectId: project.id,
    previewId: 'pm5-local-preview',
    appId: 'pm5-preview',
    repo: repoName,
  }),
);
