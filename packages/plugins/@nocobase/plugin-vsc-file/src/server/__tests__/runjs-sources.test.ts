/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import JSZip from 'jszip';

import type { RunJSRuntimeArtifact, RunJSSourceAdapterContext } from '../../shared/runjs-source-types';
import { runJSManifestPath } from '../../shared/runjs-workspace-path';
import PluginVscFileServer from '../plugin';
import { runJSSourceActionNames } from '../runjs-sources';

describe('runJSSources resource', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let currentUserId: string;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', 'system-settings', PluginVscFileServer],
    });

    const user = await app.db.getRepository('users').findOne();
    currentUserId = String(user.get('id'));
    agent = await app.agent().login(user);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('registers the RunJS source action surface', async () => {
    const resource = app.resourceManager.getResource('runJSSources');
    const actions = Array.from(resource.actions.keys()).sort();
    const expectedActions = [...runJSSourceActionNames].sort();

    expect(actions).toEqual(expectedActions);
  });

  it('returns a clear error when no adapter supports the locator kind', async () => {
    const response = await agent.resource('runJSSources').open({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_KIND_UNSUPPORTED',
      status: 400,
      details: {
        kind: 'flowModel.step',
      },
    });
  });

  it('opens, previews, publishes, and reads history from the published workspace', async () => {
    let capturedContext: RunJSSourceAdapterContext | null = null;
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];
    const locator = createLocator('fm_workspace');

    registerFlowModelAdapter({
      label: 'JS block / Workspace',
      modelUid: 'fm_workspace',
      readCode: () => 'ctx.render("legacy");',
      onReadContext: (ctx) => {
        capturedContext = ctx;
      },
      onPublish: (artifact) => {
        publishedArtifacts.push(artifact);
      },
    });

    const firstOpen = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(firstOpen.status).toBe(200);
    expect(firstOpen.body.data).toMatchObject({
      source: {
        label: 'JS block / Workspace',
        runtimeVersion: 'v2',
      },
      repository: {
        repoId: firstOpen.body.data.repository.id,
        headSeq: 1,
        headCommitId: firstOpen.body.data.repository.publishedCommitId,
      },
      permissions: {
        canRead: true,
        canWrite: true,
        canPublish: true,
      },
    });
    expect(firstOpen.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: 'ctx.render("legacy");',
        }),
        expect.objectContaining({
          path: runJSManifestPath,
          content: expect.stringContaining('"entry": "src/client/index.tsx"'),
        }),
      ]),
    );
    expect(firstOpen.body.data.history.items[0]).toMatchObject({
      id: firstOpen.body.data.repository.publishedCommitId,
      createdAt: expect.any(String),
      isPublished: true,
    });
    expect(capturedContext).toMatchObject({
      userId: currentUserId,
      request: {
        resourceName: 'runJSSources',
        actionName: 'open',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(1);

    const preview = await agent.resource('runJSSources').compilePreview({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
        baseCommitId: firstOpen.body.data.repository.publishedCommitId,
        files: [
          {
            path: 'src/client/helper.ts',
            operation: 'upsert',
            content: 'export const value = "published";',
            language: 'typescript',
          },
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'import { value } from "./helper";\nctx.render(value);',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(preview.status).toBe(200);
    expect(preview.body.data.artifact.diagnostics).toEqual([]);
    expect(preview.body.data.artifact.code).toContain('published');

    const publish = await agent.resource('runJSSources').publish({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
        baseCommitId: firstOpen.body.data.repository.publishedCommitId,
        basePublishedCommitId: firstOpen.body.data.repository.publishedCommitId,
        baseOwnerFingerprint: firstOpen.body.data.ownerFingerprint,
        basePublishedOwnerFingerprint: firstOpen.body.data.publishedOwnerFingerprint,
        message: 'Publish workspace files',
        files: [
          {
            path: 'src/client/helper.ts',
            operation: 'upsert',
            content: 'export const value = "published";',
            language: 'typescript',
          },
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'import { value } from "./helper";\nctx.render(value);',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(publish.status).toBe(200);
    expect(publish.body.data.commit).toMatchObject({
      message: 'Publish workspace files',
      seq: 2,
    });
    expect(publish.body.data.repository.publishedCommitId).toBe(publish.body.data.commit.id);
    expect(publishedArtifacts).toHaveLength(1);
    expect(publishedArtifacts[0].code).toContain('published');

    const history = await agent.resource('runJSSources').listHistory({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
      },
    });

    expect(history.status).toBe(200);
    expect(history.body.data.items).toHaveLength(2);
    expect(history.body.data.items[0]).toMatchObject({
      id: publish.body.data.commit.id,
      isPublished: true,
    });

    const version = await agent.resource('runJSSources').getVersion({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
        commitId: publish.body.data.commit.id,
        includeFiles: true,
      },
    });

    expect(version.status).toBe(200);
    expect(version.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/helper.ts',
          content: 'export const value = "published";',
        }),
      ]),
    );
  });

  it('imports a ZIP snapshot as the current published version and exposes sync/export APIs', async () => {
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];
    const locator = createLocator('fm_import_export');

    registerFlowModelAdapter({
      label: 'JS block / Import export',
      modelUid: 'fm_import_export',
      readCode: () => 'ctx.render("legacy");',
      onPublish: (artifact) => {
        publishedArtifacts.push(artifact);
      },
    });

    const opened = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    const zipBase64 = await createWorkspaceZipBase64({
      [runJSManifestPath]: `${JSON.stringify(
        {
          schemaVersion: 1,
          entry: 'src/client/index.tsx',
          runtimeVersion: 'v3',
          surfaceStyle: 'render',
          folders: ['src/client', 'src/client/widgets'],
        },
        null,
        2,
      )}\n`,
      'src/client/helper.ts': 'export const abc = 333;\n',
      'src/client/index.tsx': 'import { abc } from "./helper";\nctx.render(abc);\n',
    });

    const imported = await agent.resource('runJSSources').importZip({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: opened.body.data.repository.publishedCommitId,
        basePublishedCommitId: opened.body.data.repository.publishedCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        basePublishedOwnerFingerprint: opened.body.data.publishedOwnerFingerprint,
        message: 'Import RunJS workspace',
        zipBase64,
      },
    });

    expect(imported.status).toBe(200);
    expect(imported.body.data.import).toMatchObject({
      fileCount: 3,
      filesHash: imported.body.data.artifact.filesHash,
    });
    expect(imported.body.data.artifact.entryPath).toBe('src/client/index.tsx');
    expect(publishedArtifacts).toHaveLength(1);
    expect(publishedArtifacts[0]).toMatchObject({
      entryPath: 'src/client/index.tsx',
      version: 'v3',
    });
    expect(publishedArtifacts[0].code).toContain('333');

    const importedVersion = await agent.resource('runJSSources').getVersion({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        commitId: imported.body.data.commit.id,
        includeFiles: true,
      },
    });
    const importedManifest = importedVersion.body.data.files.find(
      (file: { path: string }) => file.path === runJSManifestPath,
    );
    expect(importedManifest.content).toContain('"folders"');
    expect(importedManifest.content).toContain('src/client/widgets');

    const syncStatus = await agent.resource('runJSSources').syncStatus({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
      },
    });

    expect(syncStatus.status).toBe(200);
    expect(syncStatus.body.data).toMatchObject({
      publishedCommitId: imported.body.data.commit.id,
      headCommitId: imported.body.data.commit.id,
      filesHash: imported.body.data.artifact.filesHash,
      runtimeCodeHash: imported.body.data.artifact.runtimeCodeHash,
      entry: 'src/client/index.tsx',
      runtimeVersion: 'v3',
      ownerFingerprint: imported.body.data.ownerFingerprint,
    });

    const exported = await agent.resource('runJSSources').exportZip({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
      },
    });

    expect(exported.status).toBe(200);
    expect(String(exported.headers['content-type'])).toContain('application/zip');
    expect(String(exported.headers['content-disposition'])).toContain('Import-export.zip');
  });

  it('rejects a supplied repository that does not belong to the RunJS source locator', async () => {
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];

    registerFlowModelAdapter({
      label: 'JS block / Repository guard',
      modelUid: 'fm_repo_guard',
      readCode: () => 'return initial;',
      onPublish: (artifact) => {
        publishedArtifacts.push(artifact);
      },
    });

    const wrongRepositoryResponse = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'runjs-source',
        ownerId: 'runjs:flowModel.step:other-model:0000000000000000',
        name: 'source',
      },
    });
    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();

    expect(wrongRepositoryResponse.status).toBe(200);

    const response = await agent.resource('runJSSources').publish({
      values: {
        locator: createLocator('fm_repo_guard'),
        repoId: wrongRepositoryResponse.body.data.repository.id,
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:fm_repo_guard:v1',
        message: 'Update guarded RunJS source',
        files: [
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'return guarded;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(response.status).toBe(403);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      status: 403,
      details: {
        repoId: wrongRepositoryResponse.body.data.repository.id,
        sourceKind: 'flowModel.step',
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    expect(publishedArtifacts).toHaveLength(0);
  });

  function registerFlowModelAdapter(input: {
    label: string;
    modelUid: string;
    readCode: () => string;
    onReadContext?: (ctx: RunJSSourceAdapterContext) => void;
    onPublish?: (artifact: RunJSRuntimeArtifact) => void;
  }) {
    let ownerFingerprint = `owner:${input.modelUid}:v1`;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: ({ locator, ctx }) => {
        if (locator.kind !== 'flowModel.step' || locator.modelUid !== input.modelUid) {
          throw new Error(`Unexpected locator ${JSON.stringify(locator)}`);
        }
        input.onReadContext?.(ctx);
        return {
          label: input.label,
          code: input.readCode(),
          version: 'v2',
          entryPath: 'src/client/legacy.ts',
          ownerFingerprint,
          surfaceStyle: 'render',
          language: 'typescript',
        };
      },
      writePublished: ({ artifact }) => {
        input.onPublish?.(artifact);
        ownerFingerprint = `owner:${input.modelUid}:v2`;
        return {
          ownerFingerprint,
        };
      },
    });
  }

  function getPlugin(): PluginVscFileServer {
    return app.pm.get(PluginVscFileServer) as PluginVscFileServer;
  }
});

function createLocator(modelUid: string) {
  return {
    kind: 'flowModel.step' as const,
    modelUid,
    flowKey: 'settings',
    stepKey: 'runjs',
    paramPath: ['code'],
  };
}

async function createWorkspaceZipBase64(files: Record<string, string>): Promise<string> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }

  return zip.generateAsync({
    compression: 'DEFLATE',
    type: 'base64',
  });
}
