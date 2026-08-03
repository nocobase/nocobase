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
const JS_TEMPLATE_PACKAGE = '@nocobase/plugin-js-template';
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
  artifactHashes: string[];
  locator: RunJSLocator;
  referenceIds: string[];
  repoHeadCommitId: string | null;
  vscCommitIds: string[];
  vscRefs: Array<{ id: string; name: string; type: string; commitId: string | null }>;
  vscRepoId: string;
}

async function getLightExtensionRecord(app: MockServer) {
  return await app.db.getRepository('applicationPlugins').findOne({
    filter: {
      name: LIGHT_EXTENSION_NAME,
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
      destination: {
        type: 'new',
        name: `preset-${suffix}`,
        title: `Preset ${suffix}`,
      },
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
  const vscRepoRecord = await app.db.getRepository('vscFileRepositories').findOne({ filterByTk: vscRepoId });
  expect(vscRepoRecord?.get('ownerType')).toBe('light-extension');
  expect(vscRepoRecord?.get('ownerId')).toBe(binding.repoId);

  const [artifacts, references, vscCommits, vscRefs] = await Promise.all([
    app.db.getRepository('lightExtensionRuntimeArtifacts').find({ sort: ['artifactHash'] }),
    app.db.getRepository('lightExtensionReferences').find({
      filter: { repoId: binding.repoId, entryId: binding.entryId },
      sort: ['id'],
    }),
    app.db.getRepository('vscFileCommits').find({ filter: { repoId: vscRepoId }, sort: ['seq'] }),
    app.db.getRepository('vscFileRefs').find({ filter: { repoId: vscRepoId }, sort: ['name'] }),
  ]);
  expect(artifacts.length).toBeGreaterThan(0);
  expect(references).toHaveLength(1);
  expect(vscCommits.length).toBeGreaterThan(0);
  expect(vscRefs.map((record) => record.get('name'))).toContain('head');

  return {
    binding,
    artifactHashes: artifacts.map((record) => String(record.get('artifactHash'))),
    domainCounts: await readLightExtensionDomainCounts(app),
    locator,
    referenceIds: references.map((record) => String(record.get('id'))),
    repoHeadCommitId: String(repoRecord?.get('headCommitId') || '') || null,
    vscCommitIds: vscCommits.map((record) => String(record.get('id'))),
    vscRefs: vscRefs.map((record) => ({
      id: String(record.get('id')),
      name: String(record.get('name')),
      type: String(record.get('type')),
      commitId: String(record.get('commitId') || '') || null,
    })),
    vscRepoId,
  };
}

async function readLightExtensionDomainCounts(app: MockServer): Promise<Record<string, number>> {
  const collectionNames = [
    'lightExtensionRepos',
    'lightExtensionEntries',
    'lightExtensionReferences',
    'lightExtensionRuntimeArtifacts',
    'lightExtensionLogs',
    'lightExtensionMoveOperations',
    'lightExtensionCreateJobs',
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
  const ownerRepositories = await app.db.getRepository('vscFileRepositories').find({
    filter: { ownerId: snapshot.binding.repoId, name: 'source' },
  });
  expect(ownerRepositories).toHaveLength(1);
  expect(ownerRepositories[0].get('id')).toBe(snapshot.vscRepoId);
  expect(ownerRepositories[0].get('ownerType')).toBe('light-extension');
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
  const references = await app.db.getRepository('lightExtensionReferences').find({
    filter: { entryId: snapshot.binding.entryId, repoId: snapshot.binding.repoId },
    sort: ['id'],
  });
  expect(references.map((record) => String(record.get('id')))).toEqual(snapshot.referenceIds);
  const artifacts = await app.db.getRepository('lightExtensionRuntimeArtifacts').find({ sort: ['artifactHash'] });
  expect(artifacts.map((record) => String(record.get('artifactHash')))).toEqual(snapshot.artifactHashes);
  expect(artifacts.map((record) => String(record.get('runtimeContract')))).toEqual(
    snapshot.artifactHashes.map(() => 'light-extension.runtime-artifact.v1'),
  );
  const vscCommits = await app.db.getRepository('vscFileCommits').find({
    filter: { repoId: snapshot.vscRepoId },
    sort: ['seq'],
  });
  expect(vscCommits.map((record) => String(record.get('id')))).toEqual(snapshot.vscCommitIds);
  const vscRefs = await app.db.getRepository('vscFileRefs').find({
    filter: { repoId: snapshot.vscRepoId },
    sort: ['name'],
  });
  expect(
    vscRefs.map((record) => ({
      id: String(record.get('id')),
      name: String(record.get('name')),
      type: String(record.get('type')),
      commitId: String(record.get('commitId') || '') || null,
    })),
  ).toEqual(snapshot.vscRefs);
  expect(app.db.getCollection('jsTemplateRepos')).toBeUndefined();

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

async function expectLegacyWorkspaceReadWriteInPlace(app: MockServer, snapshot: ExternalizedWorkspaceSnapshot) {
  const agent = await getRootAgent(app);
  const historyResponse = await agent.resource('lightExtensionFiles').listCommits({
    values: { repoId: snapshot.binding.repoId },
  });
  expect(historyResponse.status, JSON.stringify(historyResponse.body)).toBe(200);
  expect(historyResponse.body.data).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: snapshot.repoHeadCommitId })]),
  );

  const historicalResponse = await agent.resource('lightExtensionFiles').pullCommit({
    values: {
      repoId: snapshot.binding.repoId,
      commitId: snapshot.repoHeadCommitId,
      includeContent: 'all',
    },
  });
  expect(historicalResponse.status, JSON.stringify(historicalResponse.body)).toBe(200);
  expect(historicalResponse.body.data.commit.id).toBe(snapshot.repoHeadCommitId);

  const saveResponse = await agent.resource('lightExtensionFiles').saveSource({
    values: {
      repoId: snapshot.binding.repoId,
      expectedHeadCommitId: snapshot.repoHeadCommitId,
      message: 'Verify legacy JS template storage reuse',
      files: [{ path: 'README.md', content: '# Legacy JS template storage remains in place\n' }],
    },
  });
  expect(saveResponse.status, JSON.stringify(saveResponse.body)).toBe(200);

  const repoRecord = await app.db.getRepository('lightExtensionRepos').findOne({
    filterByTk: snapshot.binding.repoId,
  });
  expect(repoRecord?.get('vscRepoId')).toBe(snapshot.vscRepoId);
  expect(repoRecord?.get('headCommitId')).toBe(saveResponse.body.data.commit.id);
  const ownerRepositories = await app.db.getRepository('vscFileRepositories').find({
    filter: { ownerId: snapshot.binding.repoId, name: 'source' },
  });
  expect(ownerRepositories).toHaveLength(1);
  expect(ownerRepositories[0].get('ownerType')).toBe('light-extension');
  expect(await app.db.getRepository('vscFileCommits').count({ filter: { repoId: snapshot.vscRepoId } })).toBe(
    snapshot.vscCommitIds.length + 1,
  );
  expect(
    await app.db.getRepository('lightExtensionReferences').count({
      filter: { repoId: snapshot.binding.repoId, entryId: snapshot.binding.entryId },
    }),
  ).toBe(snapshot.referenceIds.length);
  for (const artifactHash of snapshot.artifactHashes) {
    await expect(
      app.db.getRepository('lightExtensionRuntimeArtifacts').count({ filter: { artifactHash } }),
    ).resolves.toBe(1);
  }
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
    const externalizedWorkspace = await externalizeInlineJSPage(app, 'upgrade-and-reload');

    await app.db.getRepository('applicationPlugins').destroy({
      filter: {
        name: LIGHT_EXTENSION_NAME,
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
    await expectInlineJSPageWorkspaceReady(
      app,
      'upgrade',
      true,
      externalizedWorkspace.domainCounts.lightExtensionRepos,
    );
    await expectExternalizedWorkspaceRestored(app, externalizedWorkspace);

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
    await expectLegacyWorkspaceReadWriteInPlace(app, externalizedWorkspace);
  }, 120000);

  it('upgrades the legacy package record in place without changing its enable state', async () => {
    app = await createMockServer({
      acl: true,
      plugins: [PresetNocoBase],
      registerActions: true,
      skipSupervisor: true,
    });

    const legacyRecord = await getLightExtensionRecord(app);
    expect(legacyRecord).toBeTruthy();
    const recordId = legacyRecord?.get('id');
    await legacyRecord?.update({
      packageName: LIGHT_EXTENSION_PACKAGE,
      enabled: false,
      installed: true,
    });

    await app.upgrade();

    const records = await app.db.getRepository('applicationPlugins').find({
      filter: {
        $or: [
          { name: LIGHT_EXTENSION_NAME },
          { name: 'js-template' },
          { packageName: LIGHT_EXTENSION_PACKAGE },
          { packageName: JS_TEMPLATE_PACKAGE },
        ],
      },
    });
    expect(records).toHaveLength(1);
    expect(records[0].get('id')).toBe(recordId);
    expect(records[0].get('name')).toBe(LIGHT_EXTENSION_NAME);
    expect(records[0].get('packageName')).toBe(LIGHT_EXTENSION_PACKAGE);
    expect(records[0].get('enabled')).toBe(false);
    expect(records[0].get('installed')).toBe(true);
  }, 120000);
});
