/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { PresetNocoBase } from '../index';

const LIGHT_EXTENSION_NAME = 'light-extension';
const LIGHT_EXTENSION_PACKAGE = '@nocobase/plugin-light-extension';

type RunJSLocator = Record<string, unknown>;

interface ExternalizedWorkspaceSnapshot {
  binding: {
    type: 'light-extension-entry';
    repoId: string;
    entryId: string;
    kind: string;
  };
  domainCounts: Record<string, number>;
  locator: RunJSLocator;
  repoHeadCommitId: string | null;
  vscCommitCount: number;
  vscRepoId: string;
}

async function getLightExtensionRecord(app: MockServer) {
  return await app.db.getRepository('applicationPlugins').findOne({
    filter: {
      packageName: LIGHT_EXTENSION_PACKAGE,
    },
  });
}

async function getRootAgent(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({
    filter: {
      'roles.name': 'root',
    },
  });
  expect(rootUser).toBeTruthy();
  return await app.agent().login(rootUser);
}

async function expectInlineJSPageWorkspaceReady(
  app: MockServer,
  suffix: string,
  lightExtensionDomainLoaded = true,
  expectedLightExtensionRepoCount = 0,
) {
  const agent = await getRootAgent(app);
  const pageResponse = await agent.resource('flowSurfaces').createPage({
    values: {
      pageType: 'js-page',
      idempotencyKey: `preset-inline-js-page-${suffix}`,
      title: `Preset Inline JS Page ${suffix}`,
      icon: 'CodeOutlined',
    },
  });

  expect(pageResponse.status).toBe(200);
  expect(pageResponse.body.data).toMatchObject({
    pageType: 'js-page',
    workspaceStatus: 'ready',
    runJSLocator: { kind: 'flowModel.step' },
  });

  const locator = pageResponse.body.data.runJSLocator as RunJSLocator;
  const openResponse = await agent.resource('runJSSources').open({ values: { locator } });
  expect(openResponse.status).toBe(200);
  expect(openResponse.body.data.files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: 'src/client/index.tsx' }),
      expect.objectContaining({ path: 'src/client/entry.json' }),
      expect.objectContaining({ path: '.nocobase/runjs-source.json' }),
    ]),
  );

  const saveResponse = await agent.resource('runJSSources').saveChanges({
    values: {
      locator,
      repoId: openResponse.body.data.repository.id,
      baseCommitId: openResponse.body.data.repository.headCommitId,
      baseOwnerFingerprint: openResponse.body.data.ownerFingerprint,
      message: `Verify preset Workspace lifecycle ${suffix}`,
      changes: [
        {
          operation: 'upsert',
          path: `src/client/preset-lifecycle-${suffix}.ts`,
          expectedBlobHash: null,
          content: `export const presetLifecycle = ${JSON.stringify(suffix)};`,
        },
      ],
    },
  });
  expect(saveResponse.status).toBe(200);

  const latestResponse = await agent.resource('runJSSources').openLatest({ values: { locator } });
  expect(latestResponse.status).toBe(200);
  expect(latestResponse.body.data.repository.headCommitId).toBe(saveResponse.body.data.commit.id);
  expect(latestResponse.body.data.files).toEqual(
    expect.arrayContaining([expect.objectContaining({ path: `src/client/preset-lifecycle-${suffix}.ts` })]),
  );

  const lightExtensionRepos = app.db.getRepository('lightExtensionRepos');
  if (lightExtensionDomainLoaded) {
    expect(await lightExtensionRepos?.count()).toBe(expectedLightExtensionRepoCount);
  } else {
    expect(lightExtensionRepos).toBeUndefined();
  }
}

async function expectLightExtensionUnavailable(app: MockServer) {
  const agent = await getRootAgent(app);
  const response = await agent.resource('lightExtensionRepos').list();
  expect(response.status).toBe(503);
  expect(response.body.errors[0]).toMatchObject({
    code: 'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
    status: 503,
  });
}

async function externalizeInlineJSPage(app: MockServer, suffix: string): Promise<ExternalizedWorkspaceSnapshot> {
  const agent = await getRootAgent(app);
  const pageResponse = await agent.resource('flowSurfaces').createPage({
    values: {
      pageType: 'js-page',
      idempotencyKey: `preset-external-js-page-${suffix}`,
      title: `Preset External JS Page ${suffix}`,
      icon: 'CodeOutlined',
    },
  });
  expect(pageResponse.status).toBe(200);

  const locator = pageResponse.body.data.runJSLocator as RunJSLocator;
  const openResponse = await agent.resource('runJSSources').open({ values: { locator } });
  expect(openResponse.status).toBe(200);
  const opened = openResponse.body.data;
  const files = opened.files.map((file: { path: string; content?: string; language?: string; mode?: string }) => {
    expect(typeof file.content).toBe('string');
    return {
      path: file.path,
      content: file.content,
      language: file.language,
      mode: file.mode,
    };
  });
  const moveResponse = await agent.resource('lightExtensions').moveSource({
    values: {
      idempotencyKey: `preset-externalize-${suffix}`,
      locator: opened.locator,
      expectedOwnerFingerprint: opened.ownerFingerprint,
      sourceRepoId: opened.repository.repoId,
      sourceHeadCommitId: opened.repository.headCommitId,
      entryPath: 'src/client/index.tsx',
      version: opened.source.runtimeVersion,
      files,
      destination: { type: 'default' },
      entryName: `preset-${suffix}`,
      entryTitle: `Preset external entry ${suffix}`,
    },
  });
  expect(moveResponse.status, JSON.stringify(moveResponse.body)).toBe(200);
  const moved = moveResponse.body.data;
  const binding = {
    type: 'light-extension-entry' as const,
    repoId: String(moved.binding.repoId),
    entryId: String(moved.binding.entryId),
    kind: String(moved.binding.kind),
  };
  const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
    filterByTk: binding.repoId,
  });
  expect(repoRecord).toBeTruthy();
  const vscRepoId = String(repoRecord?.get('vscRepoId'));

  return {
    binding,
    domainCounts: await readLightExtensionDomainCounts(app),
    locator,
    repoHeadCommitId: String(repoRecord?.get('headCommitId') || '') || null,
    vscCommitCount: await app.db.getRepository('vscFileCommits').count({ filter: { repoId: vscRepoId } }),
    vscRepoId,
  };
}

async function readLightExtensionDomainCounts(app: MockServer): Promise<Record<string, number>> {
  const collectionNames = [
    'lightExtensionRepos',
    'lightExtensionEntries',
    'lightExtensionReferences',
    'lightExtensionRuntimeArtifacts',
    'lightExtensionMoveOperations',
  ];
  return Object.fromEntries(
    await Promise.all(
      collectionNames.map(async (collectionName) => [
        collectionName,
        await app.db.getRepository(collectionName).count(),
      ]),
    ),
  );
}

async function expectExternalizedWorkspaceRestored(app: MockServer, snapshot: ExternalizedWorkspaceSnapshot) {
  expect(await readLightExtensionDomainCounts(app)).toEqual(snapshot.domainCounts);
  const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
    filterByTk: snapshot.binding.repoId,
  });
  expect(repoRecord).toBeTruthy();
  expect(repoRecord?.get('vscRepoId')).toBe(snapshot.vscRepoId);
  expect(repoRecord?.get('headCommitId')).toBe(snapshot.repoHeadCommitId);
  expect(
    await app.db.getRepository('lightExtensionEntries').count({
      filter: { id: snapshot.binding.entryId, repoId: snapshot.binding.repoId },
    }),
  ).toBe(1);
  expect(
    await app.db.getRepository('lightExtensionReferences').count({
      filter: { entryId: snapshot.binding.entryId, repoId: snapshot.binding.repoId },
    }),
  ).toBe(1);
  expect(await app.db.getRepository('vscFileCommits').count({ filter: { repoId: snapshot.vscRepoId } })).toBe(
    snapshot.vscCommitCount,
  );

  const agent = await getRootAgent(app);
  const readbackResponse = await agent.get(
    `/flowSurfaces:get?uid=${encodeURIComponent(String(snapshot.locator.modelUid))}`,
  );
  expect(readbackResponse.status, JSON.stringify(readbackResponse.body)).toBe(200);
  const tree = readbackResponse.body.data.tree;
  const flowKey = String(snapshot.locator.flowKey);
  expect(tree.stepParams[flowKey].runJs).toMatchObject({
    sourceMode: 'light-extension',
    sourceBinding: snapshot.binding,
  });
}

describe('Light Extension preset runtime', () => {
  let app: MockServer;

  afterEach(async () => {
    if (!app) {
      return;
    }
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('enables the Workspace provider on fresh install and upgrade without creating Light Extension repositories', async () => {
    app = await createMockServer({
      acl: true,
      plugins: [PresetNocoBase],
      registerActions: true,
      skipSupervisor: true,
    });

    const freshRecord = await getLightExtensionRecord(app);
    expect(freshRecord).toBeTruthy();
    expect(freshRecord?.get('name')).toBe(LIGHT_EXTENSION_NAME);
    expect(freshRecord?.get('packageName')).toBe(LIGHT_EXTENSION_PACKAGE);
    expect(freshRecord?.get('enabled')).toBe(true);
    expect(freshRecord?.get('builtIn')).toBe(true);
    await expectInlineJSPageWorkspaceReady(app, 'fresh-install');

    await app.db.getRepository('applicationPlugins').destroy({
      filter: {
        packageName: LIGHT_EXTENSION_PACKAGE,
      },
    });
    expect(await getLightExtensionRecord(app)).toBeNull();

    await app.upgrade();

    const upgradedRecord = await getLightExtensionRecord(app);
    expect(upgradedRecord).toBeTruthy();
    expect(upgradedRecord?.get('name')).toBe(LIGHT_EXTENSION_NAME);
    expect(upgradedRecord?.get('packageName')).toBe(LIGHT_EXTENSION_PACKAGE);
    expect(upgradedRecord?.get('enabled')).toBe(true);
    expect(upgradedRecord?.get('builtIn')).toBe(true);
    await expectInlineJSPageWorkspaceReady(app, 'upgrade');
    const externalizedWorkspace = await externalizeInlineJSPage(app, 'reload');

    await app.pm.disable(LIGHT_EXTENSION_NAME);
    await expectLightExtensionUnavailable(app);
    await expectInlineJSPageWorkspaceReady(app, 'light-extension-disabled', false);

    await app.pm.enable(LIGHT_EXTENSION_NAME);
    await expectInlineJSPageWorkspaceReady(
      app,
      'light-extension-reenabled',
      true,
      externalizedWorkspace.domainCounts.lightExtensionRepos,
    );
    await expectExternalizedWorkspaceRestored(app, externalizedWorkspace);
  }, 120000);
});
