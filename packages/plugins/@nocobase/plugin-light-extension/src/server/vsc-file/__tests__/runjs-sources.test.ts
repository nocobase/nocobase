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

import { VscError } from '../../../shared/vsc-file/errors';
import type { RunJSRuntimeArtifact, RunJSSourceAdapterContext } from '../../../shared/vsc-file/runjs-source-types';
import { runJSManifestPath } from '../../../shared/vsc-file/runjs-workspace-path';
import PluginLightExtensionServer from '../../plugin';
import { runJSSourceActionNames } from '../runjs-sources';

describe('runJSSources resource', () => {
  let app: MockServer;
  let agent: ReturnType<MockServer['agent']>;
  let currentUserId: string;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        'system-settings',
        PluginLightExtensionServer,
      ],
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

  it('keeps read-only open and export operations free of repository side effects', async () => {
    const locator = createLocator('fm_read_only');
    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {
        throw new VscError('PERMISSION_DENIED', 'Read only');
      },
      getFingerprint: () => 'owner:fm_read_only:v1',
      readLegacy: () => ({
        label: 'JS block / Read only',
        code: 'ctx.render("read only");',
        version: 'v2',
        entryPath: 'src/client/index.tsx',
        ownerFingerprint: 'owner:fm_read_only:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writeRuntime: () => {
        throw new Error('Unexpected write');
      },
    });
    const repositoryCount = await app.db.getRepository('vscFileRepositories').count();
    const commitCount = await app.db.getRepository('vscFileCommits').count();

    const opened = await agent.resource('runJSSources').open({
      values: { locator },
    });
    const exported = await agent.resource('runJSSources').exportZip({
      values: { locator },
    });

    expect(opened.status).toBe(200);
    expect(opened.body.data).toMatchObject({
      repository: {
        id: '',
        repoId: '',
        headCommitId: null,
      },
      permissions: {
        canRead: true,
        canWrite: false,
        canSave: false,
      },
      history: {
        items: [],
      },
    });
    expect(exported.status).toBe(200);
    expect(String(exported.headers['content-type'])).toContain('application/zip');
    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(repositoryCount);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
  });

  it('uses openLatest to discover a missing workspace without creating repository state', async () => {
    const locator = createLocator('fm_open_latest_missing');
    registerFlowModelAdapter({
      label: 'JS block / Open latest missing',
      modelUid: 'fm_open_latest_missing',
      readCode: () => 'ctx.render("inline only");',
    });
    const repositoryCount = await app.db.getRepository('vscFileRepositories').count();
    const commitCount = await app.db.getRepository('vscFileCommits').count();

    const response = await agent.resource('runJSSources').openLatest({
      values: { locator },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      ownerFingerprint: 'owner:fm_open_latest_missing:v1',
      repository: {
        id: '',
        repoId: '',
        headCommitId: null,
        headSeq: 0,
      },
      permissions: {
        canRead: true,
        canWrite: true,
        canSave: true,
      },
      history: {
        items: [],
      },
    });
    expect(response.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: 'ctx.render("inline only");',
        }),
      ]),
    );
    await expect(app.db.getRepository('vscFileRepositories').count()).resolves.toBe(repositoryCount);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
  });

  it('opens, previews, saves, and reads history from the head workspace', async () => {
    let capturedContext: RunJSSourceAdapterContext | null = null;
    const runtimeArtifacts: RunJSRuntimeArtifact[] = [];
    const locator = createLocator('fm_workspace');

    registerFlowModelAdapter({
      label: 'JS block / Workspace',
      modelUid: 'fm_workspace',
      readCode: () => 'ctx.render("legacy");',
      onReadContext: (ctx) => {
        capturedContext = ctx;
      },
      onSave: (artifact) => {
        runtimeArtifacts.push(artifact);
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
        headCommitId: expect.any(String),
      },
      permissions: {
        canRead: true,
        canWrite: true,
        canSave: true,
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
      id: firstOpen.body.data.repository.headCommitId,
      createdAt: expect.any(String),
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
        baseCommitId: firstOpen.body.data.repository.headCommitId,
        files: [
          {
            path: 'src/client/helper.ts',
            operation: 'upsert',
            content: 'export const value = "saved";',
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
    expect(preview.body.data.artifact.code).toContain('saved');

    const save = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
        message: 'Save workspace files',
        files: [
          {
            path: 'src/client/helper.ts',
            operation: 'upsert',
            content: 'export const value = "saved";',
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

    expect(save.status).toBe(200);
    expect(save.body.data.commit).toMatchObject({
      message: 'Save workspace files',
      seq: 2,
    });
    expect(save.body.data.repository.headCommitId).toBe(save.body.data.commit.id);
    expect(runtimeArtifacts).toHaveLength(1);
    expect(runtimeArtifacts[0].code).toContain('saved');

    const history = await agent.resource('runJSSources').listHistory({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
      },
    });

    expect(history.status).toBe(200);
    expect(history.body.data.items).toHaveLength(2);
    expect(history.body.data.items[0]).toMatchObject({
      id: save.body.data.commit.id,
    });

    const version = await agent.resource('runJSSources').getVersion({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
        commitId: save.body.data.commit.id,
        includeFiles: true,
      },
    });

    expect(version.status).toBe(200);
    expect(version.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/helper.ts',
          content: 'export const value = "saved";',
        }),
      ]),
    );
  });

  it('returns the RunJS-specific error contract when saving an unchanged workspace', async () => {
    const locator = createLocator('fm_no_changes');
    registerFlowModelAdapter({
      label: 'JS block / No changes',
      modelUid: 'fm_no_changes',
      readCode: () => 'ctx.render("legacy");',
    });
    const opened = await agent.resource('runJSSources').open({
      values: { locator },
    });

    const response = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        message: 'Save unchanged workspace',
        files: [
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'ctx.render("legacy");',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SAVE_NO_CHANGES',
      status: 409,
    });
  });

  it('previews files as a complete workspace snapshot when repoId is supplied', async () => {
    const locator = createLocator('fm_preview_snapshot');
    registerFlowModelAdapter({
      label: 'JS block / Preview snapshot',
      modelUid: 'fm_preview_snapshot',
      readCode: () => 'ctx.render("legacy");',
    });
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    const saved = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Add preview helper',
        files: [
          {
            path: 'src/client/helper.ts',
            content: 'export const helper = "saved";',
            language: 'typescript',
          },
          {
            path: 'src/client/index.tsx',
            content: 'import { helper } from "./helper";\nctx.render(helper);',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });
    expect(saved.status).toBe(200);

    const preview = await agent.resource('runJSSources').compilePreview({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: saved.body.data.commit.id,
        files: [
          {
            path: 'src/client/index.tsx',
            content: 'import { helper } from "./helper";\nctx.render(helper);',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(preview.status).toBe(200);
    expect(preview.body.data.artifact.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'RUNJS_IMPORT_NOT_FOUND',
          severity: 'error',
        }),
      ]),
    );
  });

  it('saves an independently opened editor snapshot as the next linear version', async () => {
    const runtimeArtifacts: RunJSRuntimeArtifact[] = [];
    const locator = createLocator('fm_overwrite_stale');

    registerFlowModelAdapter({
      label: 'JS block / Overwrite stale',
      modelUid: 'fm_overwrite_stale',
      readCode: () => 'ctx.render("legacy");',
      onSave: (artifact) => {
        runtimeArtifacts.push(artifact);
      },
    });

    const opened = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    const firstSave = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        message: 'Save first writer',
        files: [
          {
            path: 'src/client/extra.ts',
            operation: 'upsert',
            content: 'export const extra = "first";',
            language: 'typescript',
          },
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'import { extra } from "./extra";\nctx.render(extra);',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(firstSave.status).toBe(200);

    const secondEditorSave = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        message: 'Save second editor',
        files: [
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'ctx.render("second editor wins");',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(secondEditorSave.status).toBe(200);
    expect(secondEditorSave.body.data.commit).toMatchObject({
      parentCommitId: firstSave.body.data.commit.id,
      seq: firstSave.body.data.commit.seq + 1,
    });
    expect(runtimeArtifacts).toHaveLength(2);
    expect(runtimeArtifacts[1].code).toContain('second editor wins');

    const version = await agent.resource('runJSSources').getVersion({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        commitId: secondEditorSave.body.data.commit.id,
        includeFiles: true,
      },
    });

    expect(version.status).toBe(200);
    expect(version.body.data.files.map((file: { path: string }) => file.path)).not.toContain('src/client/extra.ts');
    expect(version.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/index.tsx',
          content: 'ctx.render("second editor wins");',
        }),
      ]),
    );
  });

  it('rejects an explicitly guarded stale full-workspace snapshot', async () => {
    const locator = createLocator('fm_guarded_stale');
    registerFlowModelAdapter({
      label: 'JS block / Guarded stale',
      modelUid: 'fm_guarded_stale',
      readCode: () => 'ctx.render("legacy");',
    });
    const opened = await agent.resource('runJSSources').open({
      values: { locator },
    });
    const openedHead = opened.body.data.repository.headCommitId;
    const openedOwnerFingerprint = opened.body.data.ownerFingerprint;

    const firstSave = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: openedHead,
        baseOwnerFingerprint: openedOwnerFingerprint,
        message: 'Save guarded first writer',
        files: [
          {
            path: 'src/client/index.tsx',
            content: 'ctx.render("first writer");',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(firstSave.status).toBe(200);

    const staleHeadSave = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: openedHead,
        baseOwnerFingerprint: openedOwnerFingerprint,
        message: 'Save guarded stale editor',
        files: [
          {
            path: 'src/client/index.tsx',
            content: 'ctx.render("stale editor");',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(staleHeadSave.status).toBe(409);
    expect(staleHeadSave.body.errors[0]).toMatchObject({
      code: 'BASE_COMMIT_OUTDATED',
      status: 409,
      details: {
        expected: firstSave.body.data.commit.id,
        received: openedHead,
      },
    });

    const staleOwnerSave = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: firstSave.body.data.commit.id,
        baseOwnerFingerprint: openedOwnerFingerprint,
        message: 'Save guarded stale owner',
        files: [
          {
            path: 'src/client/index.tsx',
            content: 'ctx.render("stale owner");',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(staleOwnerSave.status).toBe(409);
    expect(staleOwnerSave.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
      details: {
        received: openedOwnerFingerprint,
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(2);
  });

  it('rejects save when the host code diverged from the current VSC head', async () => {
    const locator = createLocator('fm_owner_diverged');
    let ownerFingerprint = 'owner:fm_owner_diverged:v1';
    let code = 'ctx.render("legacy");';
    let runtimeWritten = false;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Owner diverged',
        code,
        version: 'v2',
        entryPath: 'src/client/index.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writeRuntime: () => {
        runtimeWritten = true;
        return { ownerFingerprint };
      },
    });

    const opened = await agent.resource('runJSSources').open({
      values: { locator },
    });
    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();

    code = 'ctx.render("changed outside Studio");';
    ownerFingerprint = 'owner:fm_owner_diverged:v2';

    const response = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        message: 'Do not overwrite diverged host code',
        files: [
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'ctx.render("stale Studio edit");',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
    });
    expect(runtimeWritten).toBe(false);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);
  });

  it('rejects owner changes that happen after the preflight fingerprint check', async () => {
    const locator = createLocator('fm_owner_race');
    const initialFingerprint = 'owner:fm_owner_race:v1';
    const externalFingerprint = 'owner:fm_owner_race:external';
    let ownerFingerprint = initialFingerprint;
    let fingerprintReadCount = 0;
    let runtimeWritten = false;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => {
        fingerprintReadCount += 1;
        if (fingerprintReadCount === 2) {
          ownerFingerprint = externalFingerprint;
        }
        return ownerFingerprint;
      },
      readLegacy: () => ({
        label: 'JS block / Owner race',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'src/client/index.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writeRuntime: ({ baseOwnerFingerprint }) => {
        if (ownerFingerprint === initialFingerprint) {
          ownerFingerprint = externalFingerprint;
        }
        if (baseOwnerFingerprint !== ownerFingerprint) {
          throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS host code differs from the versioned source');
        }
        runtimeWritten = true;
        ownerFingerprint = 'owner:fm_owner_race:saved';
        return {
          ownerFingerprint,
        };
      },
    });

    const opened = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();

    const response = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        message: 'Reject owner race',
        files: [
          {
            path: 'src/client/index.tsx',
            operation: 'upsert',
            content: 'ctx.render("stale");',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
    });
    expect(runtimeWritten).toBe(false);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);
  });

  it('imports a ZIP snapshot as the current head version and exposes sync/export APIs', async () => {
    const runtimeArtifacts: RunJSRuntimeArtifact[] = [];
    const locator = createLocator('fm_import_export');

    registerFlowModelAdapter({
      label: 'JS block / Import export',
      modelUid: 'fm_import_export',
      readCode: () => 'ctx.render("legacy");',
      onSave: (artifact) => {
        runtimeArtifacts.push(artifact);
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
    expect(runtimeArtifacts).toHaveLength(1);
    expect(runtimeArtifacts[0]).toMatchObject({
      entryPath: 'src/client/index.tsx',
      version: 'v3',
    });
    expect(runtimeArtifacts[0].code).toContain('333');

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

  it('honors a manifest entry outside the fixed src/client index when importing old workspaces', async () => {
    const runtimeArtifacts: RunJSRuntimeArtifact[] = [];
    const locator = createLocator('fm_import_legacy_entry');

    registerFlowModelAdapter({
      label: 'JS block / Import legacy entry',
      modelUid: 'fm_import_legacy_entry',
      readCode: () => 'ctx.render("legacy");',
      onSave: (artifact) => {
        runtimeArtifacts.push(artifact);
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
          entry: 'src/main.tsx',
          runtimeVersion: 'v2',
          surfaceStyle: 'render',
        },
        null,
        2,
      )}\n`,
      'src/main.tsx': 'ctx.render("main");\n',
    });

    const imported = await agent.resource('runJSSources').importZip({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        message: 'Import legacy RunJS workspace',
        zipBase64,
      },
    });

    expect(imported.status).toBe(200);
    expect(imported.body.data.artifact.entryPath).toBe('src/main.tsx');
    expect(runtimeArtifacts).toHaveLength(1);
    expect(runtimeArtifacts[0]).toMatchObject({
      entryPath: 'src/main.tsx',
      version: 'v2',
    });
    expect(runtimeArtifacts[0].code).toContain('main');
  });

  it('rejects a supplied repository that does not belong to the RunJS source locator', async () => {
    const runtimeArtifacts: RunJSRuntimeArtifact[] = [];

    registerFlowModelAdapter({
      label: 'JS block / Repository guard',
      modelUid: 'fm_repo_guard',
      readCode: () => 'return initial;',
      onSave: (artifact) => {
        runtimeArtifacts.push(artifact);
      },
    });

    const wrongRepositoryResponse = await agent.resource('vscFile').createRepository({
      values: {
        ownerType: 'plugin',
        ownerId: 'runjs:flowModel.step:other-model:0000000000000000',
        name: 'source',
      },
    });
    const commitCountBeforeSave = await app.db.getRepository('vscFileCommits').count();

    expect(wrongRepositoryResponse.status).toBe(200);

    const response = await agent.resource('runJSSources').save({
      values: {
        locator: createLocator('fm_repo_guard'),
        repoId: wrongRepositoryResponse.body.data.repository.id,
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
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeSave);
    expect(runtimeArtifacts).toHaveLength(0);
  });

  function registerFlowModelAdapter(input: {
    label: string;
    modelUid: string;
    readCode: () => string;
    onReadContext?: (ctx: RunJSSourceAdapterContext) => void;
    onSave?: (artifact: RunJSRuntimeArtifact) => void;
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
      writeRuntime: ({ artifact }) => {
        input.onSave?.(artifact);
        ownerFingerprint = `owner:${input.modelUid}:v2`;
        return {
          ownerFingerprint,
        };
      },
    });
  }

  function getPlugin(): PluginLightExtensionServer {
    return app.pm.get(PluginLightExtensionServer) as PluginLightExtensionServer;
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
