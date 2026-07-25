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

import { maxFileSize } from '../../../shared/vsc-file/constants';
import { VscError } from '../../../shared/vsc-file/errors';
import type { RunJSRuntimeArtifact, RunJSSourceAdapterContext } from '../../../shared/vsc-file/runjs-source-types';
import { runJSManifestPath } from '../../../shared/vsc-file/runjs-workspace-path';
import PluginLightExtensionServer from '../../plugin';
import { buildLightExtensionSettingsHashes } from '../../services/LightExtensionEntryService';
import { LightExtensionValidator } from '../../services/LightExtensionValidator';
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
        baseCommitId: firstOpen.body.data.repository.headCommitId,
        baseOwnerFingerprint: firstOpen.body.data.ownerFingerprint,
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

  it('returns canonical Inline settings descriptors and diagnostics from open and openLatest', async () => {
    const locator = createLocator('fm_settings_descriptor');
    registerFlowModelAdapter({
      label: 'JS block / Settings descriptor',
      modelUid: 'fm_settings_descriptor',
      readCode: () => 'ctx.render("settings");',
    });
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    expect(opened.body.data.settingsDescriptor).toMatchObject({
      descriptorPath: 'src/client/entry.json',
      entryId: null,
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
      // Missing entry.json is optional for pure inline workspaces (no settings schema).
      diagnostics: [],
    });

    const descriptorContent = `${JSON.stringify(
      {
        schemaVersion: 1,
        key: 'canonical-inline',
        settings: {
          title: { type: 'string', default: 'Welcome', required: true },
          enabled: { type: 'boolean', default: false },
          count: { type: 'integer', default: 0 },
        },
      },
      null,
      2,
    )}\n`;
    const externalValidation = new LightExtensionValidator().validateWorkspace({
      files: [
        {
          path: 'src/client/js-blocks/canonical-inline/index.tsx',
          content: 'ctx.render(null);',
        },
        {
          path: 'src/client/js-blocks/canonical-inline/entry.json',
          content: descriptorContent,
        },
      ],
    });
    expect(externalValidation.accepted).toBe(true);
    const externalSchema = externalValidation.entries[0].settingsSchema;
    const externalHashes = buildLightExtensionSettingsHashes(externalSchema);

    const saved = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Add canonical settings descriptor',
        files: [
          ...opened.body.data.files.map(
            (file: { path: string; content?: string; language?: string; mode?: string }) => ({
              path: file.path,
              content: file.content || '',
              language: file.language,
              mode: file.mode,
            }),
          ),
          {
            path: 'src/client/entry.json',
            content: descriptorContent,
            language: 'json',
          },
        ],
        entryPath: 'src/client/legacy.ts',
        version: 'v2',
      },
    });
    expect(saved.status).toBe(200);

    const reopened = await agent.resource('runJSSources').open({ values: { locator } });
    expect(reopened.body.data.settingsDescriptor).toEqual({
      descriptorPath: 'src/client/entry.json',
      entryId: `inline:${opened.body.data.repository.id}:canonical-inline`,
      key: 'canonical-inline',
      schema: externalSchema,
      defaults: { title: 'Welcome', enabled: false, count: 0 },
      settingsSchemaHash: externalHashes.settingsSchemaHash,
      settingsDefaultsHash: externalHashes.settingsDefaultsHash,
      diagnostics: [],
    });
    expect(reopened.body.data.settingsDescriptor.settingsSchemaHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(reopened.body.data.settingsDescriptor.settingsDefaultsHash).toMatch(/^[a-f0-9]{64}$/u);

    const latest = await agent.resource('runJSSources').openLatest({ values: { locator } });
    expect(latest.body.data.settingsDescriptor).toEqual(reopened.body.data.settingsDescriptor);

    const malformedContent = `${JSON.stringify({
      schemaVersion: 1,
      key: 'canonical-inline',
      settings: {},
      settingsSchema: { type: 'object', properties: {} },
    })}\n`;
    const malformedSave = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: reopened.body.data.repository.id,
        baseCommitId: reopened.body.data.repository.headCommitId,
        baseOwnerFingerprint: reopened.body.data.ownerFingerprint,
        message: 'Add malformed settings descriptor',
        files: reopened.body.data.files.map(
          (file: { path: string; content?: string; language?: string; mode?: string }) => ({
            path: file.path,
            content: file.path === 'src/client/entry.json' ? malformedContent : file.content || '',
            language: file.language,
            mode: file.mode,
          }),
        ),
        entryPath: 'src/client/legacy.ts',
        version: 'v2',
      },
    });
    expect(malformedSave.status).toBe(200);

    const malformedOpen = await agent.resource('runJSSources').open({ values: { locator } });
    expect(malformedOpen.body.data.settingsDescriptor).toMatchObject({
      entryId: `inline:${opened.body.data.repository.id}:canonical-inline`,
      schema: null,
      defaults: {},
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
      diagnostics: [
        expect.objectContaining({
          code: 'entry_descriptor_settings_conflict',
          severity: 'error',
          path: 'src/client/entry.json',
        }),
      ],
    });
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
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
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

  it('opens stable file metadata and incrementally changes only explicitly listed paths', async () => {
    const locator = createLocator('fm_incremental_save');
    const runtimeArtifacts: RunJSRuntimeArtifact[] = [];
    registerFlowModelAdapter({
      label: 'JS block / Incremental save',
      modelUid: 'fm_incremental_save',
      readCode: () => 'ctx.render("legacy");',
      onSave: (artifact) => runtimeArtifacts.push(artifact),
    });
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    const initialized = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Initialize incremental workspace',
        files: [
          {
            path: 'README.md',
            content: '# Incremental workspace\n',
          },
          {
            path: 'src/client/helper.ts',
            content: 'export const value = "before";',
            language: 'typescript',
          },
          {
            path: 'src/client/index.tsx',
            content: 'import { value } from "./helper";\nctx.render(value);',
            language: 'typescript',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });
    expect(initialized.status).toBe(200);

    const workspace = await agent.resource('runJSSources').open({ values: { locator } });
    const files = workspace.body.data.files as Array<{
      path: string;
      content: string;
      blobHash: string;
      size: number;
      managed: boolean;
    }>;
    expect(files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: runJSManifestPath,
          blobHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
          managed: true,
        }),
        expect.objectContaining({
          path: 'src/client/index.tsx',
          blobHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
          managed: false,
        }),
      ]),
    );
    for (const file of files) {
      expect(file.size).toBe(Buffer.byteLength(file.content, 'utf8'));
    }
    const latestWorkspace = await agent.resource('runJSSources').openLatest({ values: { locator } });
    expect(latestWorkspace.body.data.files).toEqual(files);
    const indexFile = files.find((file) => file.path === 'src/client/index.tsx');
    const helperFile = files.find((file) => file.path === 'src/client/helper.ts');
    const readmeFile = files.find((file) => file.path === 'README.md');
    if (!indexFile || !helperFile || !readmeFile) {
      throw new Error('Incremental workspace fixtures were not opened');
    }

    const changed = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: workspace.body.data.repository.id,
        baseCommitId: workspace.body.data.repository.headCommitId,
        baseOwnerFingerprint: workspace.body.data.ownerFingerprint,
        message: 'Incrementally update helper',
        changes: [
          {
            operation: 'upsert',
            path: helperFile.path,
            expectedBlobHash: helperFile.blobHash,
            content: 'export const value = "after";',
          },
        ],
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(changed.status).toBe(200);
    expect(changed.body.data).toMatchObject({
      repository: {
        headCommitId: changed.body.data.commit.id,
      },
      artifact: {
        entryPath: 'src/client/index.tsx',
        filesHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
        runtimeCodeHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      },
      ownerFingerprint: 'owner:fm_incremental_save:v2',
    });
    expect(runtimeArtifacts[runtimeArtifacts.length - 1]?.code).toContain('after');

    const changedVersion = await agent.resource('runJSSources').getVersion({
      values: {
        locator,
        repoId: workspace.body.data.repository.id,
        commitId: changed.body.data.commit.id,
        includeFiles: true,
      },
    });
    expect(changedVersion.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: indexFile.path,
          blobHash: indexFile.blobHash,
          content: indexFile.content,
        }),
        expect.objectContaining({
          path: readmeFile.path,
          blobHash: readmeFile.blobHash,
          content: readmeFile.content,
        }),
      ]),
    );

    const created = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: workspace.body.data.repository.id,
        baseCommitId: changed.body.data.commit.id,
        baseOwnerFingerprint: changed.body.data.ownerFingerprint,
        message: 'Incrementally create component',
        changes: [
          {
            operation: 'upsert',
            path: 'src/client/components/NewPanel.ts',
            expectedBlobHash: null,
            content: 'export const panelLabel = "new";',
          },
        ],
      },
    });
    expect(created.status).toBe(200);
    const createdVersion = await agent.resource('runJSSources').getVersion({
      values: {
        locator,
        repoId: workspace.body.data.repository.id,
        commitId: created.body.data.commit.id,
        includeFiles: true,
      },
    });
    expect(createdVersion.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: indexFile.path, blobHash: indexFile.blobHash }),
        expect.objectContaining({ path: readmeFile.path, blobHash: readmeFile.blobHash }),
        expect.objectContaining({ path: helperFile.path, content: 'export const value = "after";' }),
        expect.objectContaining({
          path: 'src/client/components/NewPanel.ts',
          content: 'export const panelLabel = "new";',
        }),
      ]),
    );

    const deleted = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: workspace.body.data.repository.id,
        baseCommitId: created.body.data.commit.id,
        baseOwnerFingerprint: created.body.data.ownerFingerprint,
        message: 'Explicitly delete readme',
        changes: [
          {
            operation: 'delete',
            path: readmeFile.path,
            expectedBlobHash: readmeFile.blobHash,
          },
        ],
      },
    });
    expect(deleted.status).toBe(200);
    const deletedVersion = await agent.resource('runJSSources').getVersion({
      values: {
        locator,
        repoId: workspace.body.data.repository.id,
        commitId: deleted.body.data.commit.id,
        includeFiles: true,
      },
    });
    expect(deletedVersion.body.data.files.map((file: { path: string }) => file.path)).not.toContain('README.md');
    expect(deletedVersion.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: indexFile.path, blobHash: indexFile.blobHash }),
        expect.objectContaining({ path: helperFile.path, content: 'export const value = "after";' }),
        expect.objectContaining({ path: 'src/client/components/NewPanel.ts' }),
      ]),
    );

    const stale = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: workspace.body.data.repository.id,
        baseCommitId: workspace.body.data.repository.headCommitId,
        baseOwnerFingerprint: workspace.body.data.ownerFingerprint,
        message: 'Reject stale incremental base',
        changes: [
          {
            operation: 'upsert',
            path: indexFile.path,
            expectedBlobHash: indexFile.blobHash,
            content: 'ctx.render("stale");',
          },
        ],
      },
    });
    expect(stale.status).toBe(409);
    expect(stale.body.errors[0]).toMatchObject({ code: 'BASE_COMMIT_OUTDATED' });
  });

  it('rejects incremental blob conflicts and direct managed manifest changes without side effects', async () => {
    const locator = createLocator('fm_incremental_conflict');
    const runtimeArtifacts: RunJSRuntimeArtifact[] = [];
    registerFlowModelAdapter({
      label: 'JS block / Incremental conflict',
      modelUid: 'fm_incremental_conflict',
      readCode: () => 'ctx.render("legacy");',
      onSave: (artifact) => runtimeArtifacts.push(artifact),
    });
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    const indexFile = opened.body.data.files.find((file: { path: string }) => file.path === 'src/client/index.tsx');
    const manifestFile = opened.body.data.files.find((file: { path: string }) => file.path === runJSManifestPath);
    const commitCount = await app.db.getRepository('vscFileCommits').count();

    const conflicted = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Reject stale file blob',
        changes: [
          {
            operation: 'upsert',
            path: indexFile.path,
            expectedBlobHash: '0'.repeat(64),
            content: 'ctx.render("conflicted");',
          },
        ],
      },
    });
    expect(conflicted.status).toBe(409);
    expect(conflicted.body.errors[0]).toMatchObject({
      code: 'RUNJS_FILE_CONFLICT',
      details: {
        path: indexFile.path,
        expectedBlobHash: '0'.repeat(64),
        currentBlobHash: indexFile.blobHash,
      },
    });

    const existingAsCreate = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Reject existing file as create',
        changes: [
          {
            operation: 'upsert',
            path: indexFile.path,
            expectedBlobHash: null,
            content: 'ctx.render("not a create");',
          },
        ],
      },
    });
    expect(existingAsCreate.status).toBe(409);
    expect(existingAsCreate.body.errors[0]).toMatchObject({
      code: 'RUNJS_FILE_CONFLICT',
      details: {
        path: indexFile.path,
        expectedBlobHash: null,
        currentBlobHash: indexFile.blobHash,
      },
    });

    const missingDelete = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Reject deleting missing file',
        changes: [
          {
            operation: 'delete',
            path: 'src/client/missing.ts',
            expectedBlobHash: null,
          },
        ],
      },
    });
    expect(missingDelete.status).toBe(409);
    expect(missingDelete.body.errors[0]).toMatchObject({
      code: 'RUNJS_FILE_CONFLICT',
      details: {
        path: 'src/client/missing.ts',
        expectedBlobHash: null,
        currentBlobHash: null,
      },
    });

    const managed = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Reject managed manifest edit',
        changes: [
          {
            operation: 'delete',
            path: manifestFile.path,
            expectedBlobHash: manifestFile.blobHash,
          },
        ],
      },
    });
    expect(managed.status).toBe(403);
    expect(managed.body.errors[0]).toMatchObject({
      code: 'PERMISSION_DENIED',
      details: {
        path: runJSManifestPath,
        managed: true,
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
    expect(runtimeArtifacts).toHaveLength(0);
    const latest = await agent.resource('runJSSources').openLatest({ values: { locator } });
    expect(latest.body.data.repository.headCommitId).toBe(opened.body.data.repository.headCommitId);
    expect(latest.body.data.ownerFingerprint).toBe(opened.body.data.ownerFingerprint);
  });

  it('keeps incremental no-op, compile, resource-limit, owner, and runtime-write failures atomic', async () => {
    const locator = createLocator('fm_incremental_atomic');
    let ownerFingerprint = 'owner:fm_incremental_atomic:v1';
    let runtimeWriteCount = 0;
    let rejectRuntimeWrite = false;
    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Incremental atomic',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'src/client/index.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writeRuntime: () => {
        runtimeWriteCount += 1;
        if (rejectRuntimeWrite) {
          throw new VscError('INTERNAL_ERROR', 'Runtime write failed');
        }
        ownerFingerprint = 'owner:fm_incremental_atomic:v2';
        return { ownerFingerprint };
      },
    });
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    const indexFile = opened.body.data.files.find((file: { path: string }) => file.path === 'src/client/index.tsx');
    const commitCount = await app.db.getRepository('vscFileCommits').count();
    const baseValues = {
      locator,
      repoId: opened.body.data.repository.id,
      baseCommitId: opened.body.data.repository.headCommitId,
      baseOwnerFingerprint: opened.body.data.ownerFingerprint,
    };

    const noOp = await agent.resource('runJSSources').saveChanges({
      values: {
        ...baseValues,
        message: 'Reject unchanged incremental file',
        changes: [
          {
            operation: 'upsert',
            path: indexFile.path,
            expectedBlobHash: indexFile.blobHash,
            content: indexFile.content,
          },
        ],
      },
    });
    expect(noOp.status).toBe(409);
    expect(noOp.body.errors[0]).toMatchObject({ code: 'RUNJS_SAVE_NO_CHANGES' });

    const compileFailure = await agent.resource('runJSSources').saveChanges({
      values: {
        ...baseValues,
        message: 'Reject incomplete incremental compile',
        changes: [
          {
            operation: 'upsert',
            path: indexFile.path,
            expectedBlobHash: indexFile.blobHash,
            content: 'import { missing } from "./missing";\nctx.render(missing);',
          },
        ],
      },
    });
    expect(compileFailure.status).toBe(400);
    expect(compileFailure.body.errors[0]).toMatchObject({ code: 'RUNJS_IMPORT_NOT_FOUND' });

    const oversized = await agent.resource('runJSSources').saveChanges({
      values: {
        ...baseValues,
        message: 'Reject oversized incremental file',
        changes: [
          {
            operation: 'upsert',
            path: 'src/client/oversized.ts',
            expectedBlobHash: null,
            content: 'x'.repeat(maxFileSize + 1),
          },
        ],
      },
    });
    expect(oversized.status).toBe(413);
    expect(oversized.body.errors[0]).toMatchObject({ code: 'FILE_TOO_LARGE' });

    ownerFingerprint = 'owner:fm_incremental_atomic:external';
    const staleOwner = await agent.resource('runJSSources').saveChanges({
      values: {
        ...baseValues,
        message: 'Reject stale incremental owner',
        changes: [
          {
            operation: 'upsert',
            path: indexFile.path,
            expectedBlobHash: indexFile.blobHash,
            content: 'ctx.render("stale owner");',
          },
        ],
      },
    });
    expect(staleOwner.status).toBe(409);
    expect(staleOwner.body.errors[0]).toMatchObject({ code: 'RUNJS_SOURCE_OWNER_OUTDATED' });

    ownerFingerprint = opened.body.data.ownerFingerprint;
    rejectRuntimeWrite = true;
    const runtimeFailure = await agent.resource('runJSSources').saveChanges({
      values: {
        ...baseValues,
        message: 'Roll back failed runtime write',
        changes: [
          {
            operation: 'upsert',
            path: indexFile.path,
            expectedBlobHash: indexFile.blobHash,
            content: 'ctx.render("runtime failure");',
          },
        ],
      },
    });
    expect(runtimeFailure.status).toBe(500);
    expect(runtimeFailure.body.errors[0]).toMatchObject({ code: 'INTERNAL_ERROR' });
    expect(runtimeWriteCount).toBe(1);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
    const latest = await agent.resource('runJSSources').openLatest({ values: { locator } });
    expect(latest.body.data.repository.headCommitId).toBe(opened.body.data.repository.headCommitId);
    expect(latest.body.data.files).toEqual(opened.body.data.files);
  });

  it('keeps incremental permission failures free of repository and runtime side effects', async () => {
    const locator = createLocator('fm_incremental_permission');
    let canWrite = true;
    let runtimeWritten = false;
    const ownerFingerprint = 'owner:fm_incremental_permission:v1';
    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {
        if (!canWrite) {
          throw new VscError('PERMISSION_DENIED', 'RunJS source is read only');
        }
      },
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Incremental permission',
        code: 'ctx.render("legacy");',
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
    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    const indexFile = opened.body.data.files.find((file: { path: string }) => file.path === 'src/client/index.tsx');
    const commitCount = await app.db.getRepository('vscFileCommits').count();
    canWrite = false;

    const response = await agent.resource('runJSSources').saveChanges({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Reject incremental permission failure',
        changes: [
          {
            operation: 'upsert',
            path: indexFile.path,
            expectedBlobHash: indexFile.blobHash,
            content: 'ctx.render("forbidden");',
          },
        ],
      },
    });

    expect(response.status).toBe(403);
    expect(response.body.errors[0]).toMatchObject({ code: 'PERMISSION_DENIED' });
    expect(runtimeWritten).toBe(false);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCount);
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

  it('saves a complete snapshot against an explicit latest baseline', async () => {
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
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
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
        baseCommitId: firstSave.body.data.repository.headCommitId,
        baseOwnerFingerprint: firstSave.body.data.ownerFingerprint,
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
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
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

  it('recovers an owner conflict through openLatest, preview, and a merged full-snapshot save', async () => {
    const locator = createLocator('fm_owner_recovery');
    let ownerFingerprint = 'owner:fm_owner_recovery:v1';
    let code = 'ctx.render("legacy");';
    let writtenBaseOwnerFingerprint: string | undefined;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Owner recovery',
        code,
        version: 'v2',
        entryPath: 'src/client/index.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writeRuntime: ({ artifact, baseOwnerFingerprint }) => {
        writtenBaseOwnerFingerprint = baseOwnerFingerprint;
        code = artifact.code;
        ownerFingerprint = 'owner:fm_owner_recovery:v3';
        return { ownerFingerprint };
      },
    });

    const opened = await agent.resource('runJSSources').open({ values: { locator } });
    const initialHeadCommitId = opened.body.data.repository.headCommitId;
    code = 'ctx.render("changed outside Studio");';
    ownerFingerprint = 'owner:fm_owner_recovery:v2';

    const staleSave = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: opened.body.data.repository.id,
        baseCommitId: initialHeadCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
        message: 'Reject stale owner snapshot',
        files: opened.body.data.files,
      },
    });
    expect(staleSave.status).toBe(409);
    expect(staleSave.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      message: 'RunJS host code differs from the versioned source',
    });

    const latest = await agent.resource('runJSSources').openLatest({ values: { locator } });
    expect(latest.status).toBe(200);
    expect(latest.body.data).toMatchObject({
      ownerFingerprint: 'owner:fm_owner_recovery:v2',
      legacy: {
        code: 'ctx.render("changed outside Studio");',
      },
      repository: {
        headCommitId: initialHeadCommitId,
      },
    });
    const mergedFiles = latest.body.data.files.map(
      (file: { path: string; content?: string; language?: string; mode?: string }) => ({
        path: file.path,
        operation: 'upsert' as const,
        content:
          file.path === 'src/client/index.tsx'
            ? 'ctx.render("merged outside change and Studio edit");'
            : file.content || '',
        language: file.language,
        mode: file.mode,
      }),
    );

    const preview = await agent.resource('runJSSources').compilePreview({
      values: {
        locator,
        repoId: latest.body.data.repository.id,
        baseCommitId: latest.body.data.repository.headCommitId,
        files: mergedFiles,
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });
    expect(preview.status).toBe(200);
    expect(preview.body.data.artifact.diagnostics).toEqual([]);

    const recovered = await agent.resource('runJSSources').save({
      values: {
        locator,
        repoId: latest.body.data.repository.id,
        baseCommitId: latest.body.data.repository.headCommitId,
        baseOwnerFingerprint: latest.body.data.ownerFingerprint,
        message: 'Merge owner conflict',
        files: mergedFiles,
        entryPath: 'src/client/index.tsx',
        version: 'v2',
      },
    });

    expect(recovered.status).toBe(200);
    expect(recovered.body.data.commit.parentCommitId).toBe(initialHeadCommitId);
    expect(recovered.body.data.ownerFingerprint).toBe('owner:fm_owner_recovery:v3');
    expect(writtenBaseOwnerFingerprint).toBe('owner:fm_owner_recovery:v2');
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
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
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
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
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
        baseCommitId: opened.body.data.repository.headCommitId,
        baseOwnerFingerprint: opened.body.data.ownerFingerprint,
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
        baseCommitId: null,
        baseOwnerFingerprint: 'wrong-repository-owner',
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
