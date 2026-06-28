/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';

import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../shared/constants';
import { VscError } from '../../shared/errors';
import {
  buildRunJSFilesHash,
  buildRunJSSourceRepositoryIdentity,
  type RunJSRuntimeArtifact,
  type RunJSSourceAdapterContext,
} from '../../shared/runjs-source-types';
import { runJSManifestPath } from '../../shared/runjs-workspace-path';
import PluginVscFileServer from '../plugin';
import { assertRunJSCompileInputLimits, runJSSourceActionNames } from '../runjs-sources';
import { VscFileService } from '../services/VscFileService';

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

  it('returns unsupported kind for an unknown RunJS source kind', async () => {
    const response = await agent.resource('runJSSources').open({
      values: {
        locator: {
          kind: 'custom.runjs',
        },
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_KIND_UNSUPPORTED',
      status: 400,
      details: {
        kind: 'custom.runjs',
      },
    });
  });

  it('opens a RunJS source through the registered owner adapter', async () => {
    let capturedContext: RunJSSourceAdapterContext | null = null;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:fingerprint:v1',
      writePublished: () => ({
        ownerFingerprint: 'owner:fingerprint:v2',
      }),
      readLegacy: ({ ctx }) => {
        capturedContext = ctx;
        return {
          label: 'JS block / Write JavaScript',
          code: 'return ctx;',
          version: 'v2',
          entry: 'src/main.tsx',
          ownerFingerprint: 'owner:fingerprint:v1',
          surfaceStyle: 'render',
          language: 'typescript',
        };
      },
    });

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

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      locatorKind: 'flowModel.step',
      repositoryIdentity: {
        ownerType: 'runjs-source',
        name: 'source',
      },
      legacy: {
        label: 'JS block / Write JavaScript',
        code: 'return ctx;',
        version: 'v2',
      },
      ownerFingerprint: 'owner:fingerprint:v1',
    });
    expect(response.body.data.repositoryIdentity.ownerId).toMatch(/^runjs:flowModel\.step:fm_1:[a-f0-9]{16}$/);
    expect(capturedContext).toMatchObject({
      userId: currentUserId,
      request: {
        resourceName: 'runJSSources',
        actionName: 'open',
      },
    });
  });

  it('opens a workspace from legacy code once and supports draft, diff, history, version, and preview APIs', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_workspace',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:workspace:v1',
      writePublished: () => ({
        ownerFingerprint: 'owner:workspace:v2',
      }),
      readLegacy: () => ({
        label: 'JS block / Workspace',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:workspace:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
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
        ownerFingerprint: 'owner:workspace:v1',
      },
      repository: {
        repoId: firstOpen.body.data.repository.id,
        headSeq: 1,
        headCommitId: firstOpen.body.data.repository.publishedCommitId,
      },
      files: expect.arrayContaining([
        expect.objectContaining({
          path: 'src/main.tsx',
          content: 'ctx.render("legacy");',
        }),
        expect.objectContaining({
          path: runJSManifestPath,
          content: expect.stringContaining('"entry": "src/main.tsx"'),
        }),
      ]),
      draft: null,
      permissions: {
        canRead: true,
        canWrite: true,
        canPublish: true,
      },
    });
    expect(firstOpen.body.data.history.items[0]).toMatchObject({
      id: firstOpen.body.data.repository.publishedCommitId,
      isPublished: true,
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(1);

    const secondOpen = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(secondOpen.status).toBe(200);
    expect(secondOpen.body.data.repository.id).toBe(firstOpen.body.data.repository.id);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(1);

    const saveDraft = await agent.resource('runJSSources').saveDraft({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
        baseCommitId: firstOpen.body.data.repository.publishedCommitId,
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("draft");',
            language: 'typescript',
          },
        ],
      },
    });

    expect(saveDraft.status).toBe(200);
    expect(saveDraft.body.data.draft).toMatchObject({
      baseCommitId: firstOpen.body.data.repository.publishedCommitId,
      status: 'active',
    });
    expect(saveDraft.body.data.files).toHaveLength(1);
    expect(saveDraft.body.data.files[0]).toMatchObject({
      path: 'src/main.tsx',
      content: 'ctx.render("draft");',
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(1);

    const reopenedDraft = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(reopenedDraft.status).toBe(200);
    expect(reopenedDraft.body.data.draft.files[0]).toMatchObject({
      path: 'src/main.tsx',
      content: 'ctx.render("draft");',
    });

    const savedDraftDiff = await agent.resource('runJSSources').diffDraft({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
      },
    });

    expect(savedDraftDiff.status).toBe(200);
    expect(savedDraftDiff.body.data.diff.summary.modified).toBe(1);

    const unsavedDiff = await agent.resource('runJSSources').diffDraft({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("unsaved");',
            language: 'typescript',
          },
        ],
      },
    });

    expect(unsavedDiff.status).toBe(200);
    expect(unsavedDiff.body.data.diff.summary.modified).toBe(1);

    const preview = await agent.resource('runJSSources').compilePreview({
      values: {
        locator,
        entry: 'src/main.tsx',
        files: [
          {
            path: 'src/main.tsx',
            content: "import { text } from './helper';\nctx.render(text);",
            language: 'typescript',
          },
          {
            path: 'src/helper.ts',
            content: "export const text = 'hello';",
            language: 'typescript',
          },
        ],
      },
    });

    expect(preview.status).toBe(200);
    expect(preview.body.data.artifact).toMatchObject({
      entryPath: 'src/main.tsx',
      diagnostics: [],
    });
    expect(preview.body.data.artifact.code).toContain("const text = 'hello';");
    expect(preview.body.data.artifact.code).not.toContain('import');

    const history = await agent.resource('runJSSources').listHistory({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
      },
    });

    expect(history.status).toBe(200);
    expect(history.body.data.items).toEqual([
      expect.objectContaining({
        id: firstOpen.body.data.repository.publishedCommitId,
        isPublished: true,
      }),
    ]);

    const version = await agent.resource('runJSSources').getVersion({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
        commitId: firstOpen.body.data.repository.publishedCommitId,
        includeFiles: true,
      },
    });

    expect(version.status).toBe(200);
    expect(version.body.data.commit).toMatchObject({
      id: firstOpen.body.data.repository.publishedCommitId,
      isPublished: true,
    });
    expect(version.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/main.tsx',
          content: 'ctx.render("legacy");',
        }),
        expect.objectContaining({
          path: runJSManifestPath,
          content: expect.stringContaining('"entry": "src/main.tsx"'),
        }),
      ]),
    );

    const rootDiff = await agent.resource('runJSSources').diffVersion({
      values: {
        locator,
        repoId: firstOpen.body.data.repository.id,
        commitId: firstOpen.body.data.repository.publishedCommitId,
      },
    });

    expect(rootDiff.status).toBe(200);
    expect(rootDiff.body.data).toMatchObject({
      fromIsPublished: false,
      toIsPublished: true,
    });
    expect(rootDiff.body.data.diff.summary.added).toBe(2);
  });

  it('opens an existing pre-manifest RunJS repository with a draft-only default manifest', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_manifest_draft',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };
    const ownerFingerprint = 'owner:manifest-draft:v1';
    const service = new VscFileService(app.db);
    const initialized = await service.ensureRepository({
      ...buildRunJSSourceRepositoryIdentity(locator),
      initialFiles: [
        {
          path: 'src/main.tsx',
          content: 'ctx.render("legacy");',
          language: 'typescript',
        },
      ],
      message: 'Legacy RunJS source without manifest',
      authorId: currentUserId,
      metadata: {
        sourceKind: locator.kind,
        ownerFingerprint,
      },
    });
    if (!initialized.initialCommit) {
      throw new Error('Expected initial commit');
    }
    await service.updateRef({
      repoId: initialized.repository.id,
      name: 'published',
      targetCommitId: initialized.initialCommit.id,
      basePublishedCommitId: null,
    });

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      writePublished: () => ({
        ownerFingerprint: 'owner:manifest-draft:v2',
      }),
      readLegacy: () => ({
        label: 'JS block / Manifest draft',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
    });

    const commitCountBeforeOpen = await app.db.getRepository('vscFileCommits').count();
    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(open.status).toBe(200);
    expect(open.body.data.files).toEqual([
      expect.objectContaining({
        path: 'src/main.tsx',
        content: 'ctx.render("legacy");',
      }),
    ]);
    expect(open.body.data.draft).toMatchObject({
      baseCommitId: initialized.initialCommit.id,
      status: 'active',
      files: [
        expect.objectContaining({
          path: runJSManifestPath,
          content: expect.stringContaining('"entry": "src/main.tsx"'),
        }),
      ],
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeOpen);
  });

  it('replaces RunJS draft files instead of merging stale draft-only paths', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_replace_draft',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:replace-draft:v1',
      writePublished: () => ({
        ownerFingerprint: 'owner:replace-draft:v2',
      }),
      readLegacy: () => ({
        label: 'JS block / Replace draft',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:replace-draft:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
    });

    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    expect(open.status).toBe(200);

    const withHelper = await agent.resource('runJSSources').saveDraft({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: open.body.data.repository.publishedCommitId,
        files: [
          {
            path: 'src/helper.ts',
            operation: 'upsert',
            content: 'export const helper = true;',
            language: 'typescript',
          },
        ],
      },
    });
    expect(withHelper.status).toBe(200);
    expect(withHelper.body.data.files.map((file) => file.path)).toEqual(['src/helper.ts']);

    const withoutHelper = await agent.resource('runJSSources').saveDraft({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: open.body.data.repository.publishedCommitId,
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("changed");',
            language: 'typescript',
          },
        ],
      },
    });
    expect(withoutHelper.status).toBe(200);
    expect(withoutHelper.body.data.files.map((file) => file.path)).toEqual(['src/main.tsx']);

    const cleared = await agent.resource('runJSSources').saveDraft({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: open.body.data.repository.publishedCommitId,
        files: [],
      },
    });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.files).toEqual([]);
  });

  it('rejects disallowed RunJS workspace file paths on direct resource calls', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_path_guard',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:path-guard:v1',
      writePublished: () => ({
        ownerFingerprint: 'owner:path-guard:v2',
      }),
      readLegacy: () => ({
        label: 'JS block / Path guard',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:path-guard:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
    });

    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    expect(open.status).toBe(200);

    const invalidFile = {
      path: 'src/.hidden/file.ts',
      operation: 'upsert' as const,
      content: 'ctx.render("hidden");',
      language: 'typescript',
    };
    const commonValues = {
      locator,
      repoId: open.body.data.repository.id,
      baseCommitId: open.body.data.repository.publishedCommitId,
    };
    const cases = [
      {
        action: 'saveDraft',
        run: () =>
          agent.resource('runJSSources').saveDraft({
            values: {
              ...commonValues,
              files: [invalidFile],
            },
          }),
      },
      {
        action: 'rebaseDraft',
        run: () =>
          agent.resource('runJSSources').rebaseDraft({
            values: {
              ...commonValues,
              files: [invalidFile],
            },
          }),
      },
      {
        action: 'diffDraft',
        run: () =>
          agent.resource('runJSSources').diffDraft({
            values: {
              ...commonValues,
              files: [invalidFile],
            },
          }),
      },
      {
        action: 'compilePreview',
        run: () =>
          agent.resource('runJSSources').compilePreview({
            values: {
              locator,
              entryPath: 'src/main.tsx',
              files: [invalidFile],
            },
          }),
      },
      {
        action: 'publish',
        run: () =>
          agent.resource('runJSSources').publish({
            values: {
              ...commonValues,
              basePublishedCommitId: open.body.data.repository.publishedCommitId,
              baseOwnerFingerprint: 'owner:path-guard:v1',
              message: 'Update guarded source',
              files: [invalidFile],
            },
          }),
      },
    ];

    for (const testCase of cases) {
      const response = await testCase.run();
      expect(response.status, testCase.action).toBe(400);
      expect(response.body.errors[0], testCase.action).toMatchObject({
        code: 'PATH_INVALID',
        status: 400,
        details: {
          reason: 'hiddenDirectory',
        },
      });
    }

    const invalidEntry = await agent.resource('runJSSources').compilePreview({
      values: {
        locator,
        entryPath: '../outside.ts',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("ok");',
            language: 'typescript',
          },
        ],
      },
    });

    expect(invalidEntry.status).toBe(400);
    expect(invalidEntry.body.errors[0]).toMatchObject({
      code: 'PATH_INVALID',
      status: 400,
    });
  });

  it('rejects disallowed legacy RunJS entry paths when initializing a source repository', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_legacy_path_guard',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:legacy-path:v1',
      writePublished: () => ({
        ownerFingerprint: 'owner:legacy-path:v2',
      }),
      readLegacy: () => ({
        label: 'JS block / Legacy path guard',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'scripts/main.ts',
        ownerFingerprint: 'owner:legacy-path:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
    });

    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(open.status).toBe(400);
    expect(open.body.errors[0]).toMatchObject({
      code: 'PATH_INVALID',
      status: 400,
      details: {
        reason: 'outsideWorkspace',
      },
    });
  });

  it('reports publish permission separately from draft write permission', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_permissions',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:permissions:v1',
      writePublished: () => ({
        ownerFingerprint: 'owner:permissions:v2',
      }),
      readLegacy: () => ({
        label: 'JS block / Permissions',
        code: 'ctx.render("permissions");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:permissions:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
    });

    const firstOpen = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(firstOpen.status).toBe(200);

    getPlugin().registerPermissionHook((input) => {
      return input.action === 'updateRef' && input.refName === 'published' ? false : true;
    });

    const reopened = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(reopened.status).toBe(200);
    expect(reopened.body.data.permissions).toMatchObject({
      canRead: true,
      canWrite: true,
      canPublish: false,
    });
  });

  it('opens an existing RunJS repository when create permission is denied', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_read_only_existing',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:read-only:v1',
      writePublished: () => ({
        ownerFingerprint: 'owner:read-only:v2',
      }),
      readLegacy: () => ({
        label: 'JS block / Existing read-only',
        code: 'ctx.render("existing");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:read-only:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
    });

    const firstOpen = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    expect(firstOpen.status).toBe(200);

    getPlugin().registerPermissionHook((input) => {
      return input.action === 'createRepository' ? false : true;
    });

    const reopened = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(reopened.status).toBe(200);
    expect(reopened.body.data.repository.repoId).toBe(firstOpen.body.data.repository.repoId);
    expect(reopened.body.data.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/main.tsx',
          content: 'ctx.render("existing");',
        }),
      ]),
    );
  });

  it('rejects publish compile errors before creating a VSC commit or writing the owner', async () => {
    let writePublishedCalled = false;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:compile:v1',
      readLegacy: () => ({
        label: 'JS block / Compile guard',
        code: 'ctx.render("initial");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:compile:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: () => {
        writePublishedCalled = true;
        return {
          ownerFingerprint: 'owner:compile:v2',
        };
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const response = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_compile',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:compile:v1',
        message: 'Broken RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'const = ;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_COMPILE_FAILED',
      status: 400,
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    expect(writePublishedCalled).toBe(false);
  });

  it('rejects missing imports before creating a VSC commit or writing the owner', async () => {
    let writePublishedCalled = false;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:missing-import:v1',
      readLegacy: () => ({
        label: 'JS block / Missing import guard',
        code: 'ctx.render("initial");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:missing-import:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: () => {
        writePublishedCalled = true;
        return {
          ownerFingerprint: 'owner:missing-import:v2',
        };
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const response = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_missing_import',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:missing-import:v1',
        message: 'Broken RunJS import',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: "import { missing } from './missing';\nctx.render(missing);",
            language: 'typescript',
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_IMPORT_NOT_FOUND',
      status: 400,
      details: {
        diagnostics: expect.arrayContaining([
          expect.objectContaining({
            code: 'RUNJS_IMPORT_NOT_FOUND',
            path: 'src/main.tsx',
          }),
        ]),
      },
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    expect(writePublishedCalled).toBe(false);
  });

  it('publishes patch changes against unchanged imported base files', async () => {
    let ownerFingerprint = 'owner:patch-compile:v1';
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_patch_compile',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Patch compile',
        code: 'ctx.render("initial");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: ({ artifact }) => {
        publishedArtifacts.push(artifact);
        ownerFingerprint = `owner:patch-compile:v${publishedArtifacts.length + 1}`;
        return {
          ownerFingerprint,
        };
      },
    });

    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    expect(open.status).toBe(200);

    const firstPublish = await agent.resource('runJSSources').publish({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: open.body.data.repository.publishedCommitId,
        basePublishedCommitId: open.body.data.repository.publishedCommitId,
        baseOwnerFingerprint: open.body.data.ownerFingerprint,
        message: 'Add helper module',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: "import { message } from './helper';\nctx.render(message);",
            language: 'typescript',
          },
          {
            path: 'src/helper.ts',
            operation: 'upsert',
            content: "export const message = 'from helper';",
            language: 'typescript',
          },
        ],
      },
    });
    expect(firstPublish.status).toBe(200);

    const preview = await agent.resource('runJSSources').compilePreview({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: firstPublish.body.data.commit.id,
        entryPath: 'src/main.tsx',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: "import { message } from './helper';\nctx.render(message.toLowerCase());",
            language: 'typescript',
          },
        ],
      },
    });
    expect(preview.status).toBe(200);
    expect(preview.body.data.artifact.diagnostics).toEqual([]);
    expect(preview.body.data.artifact.code).toContain("const message = 'from helper';");
    expect(preview.body.data.artifact.code).toContain('ctx.render(message.toLowerCase());');

    const secondPublish = await agent.resource('runJSSources').publish({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: firstPublish.body.data.commit.id,
        basePublishedCommitId: firstPublish.body.data.commit.id,
        baseOwnerFingerprint: firstPublish.body.data.ownerFingerprint,
        message: 'Update entry only',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: "import { message } from './helper';\nctx.render(message.toUpperCase());",
            language: 'typescript',
          },
        ],
      },
    });

    expect(secondPublish.status).toBe(200);
    expect(publishedArtifacts).toHaveLength(2);
    expect(publishedArtifacts[1].code).toContain("const message = 'from helper';");
    expect(publishedArtifacts[1].code).toContain('ctx.render(message.toUpperCase());');
  });

  it('publishes RunJS draft blob hashes by compiling the resolved draft content', async () => {
    let ownerFingerprint = 'owner:draft-blob:v1';
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_draft_blob',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Draft blob',
        code: 'return initial;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: ({ artifact }) => {
        publishedArtifacts.push(artifact);
        ownerFingerprint = 'owner:draft-blob:v2';
        return {
          ownerFingerprint,
        };
      },
    });

    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    expect(open.status).toBe(200);

    const draft = await agent.resource('runJSSources').saveDraft({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: open.body.data.repository.publishedCommitId,
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("draft blob");',
            language: 'typescript',
          },
        ],
      },
    });
    expect(draft.status).toBe(200);

    const draftFile = draft.body.data.files.find(
      (file: { path: string; blobHash?: string | null }) => file.path === 'src/main.tsx',
    );
    expect(draftFile?.blobHash).toMatch(/^[a-f0-9]{64}$/);

    const publish = await agent.resource('runJSSources').publish({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: open.body.data.repository.publishedCommitId,
        basePublishedCommitId: open.body.data.repository.publishedCommitId,
        baseOwnerFingerprint: open.body.data.ownerFingerprint,
        message: 'Publish draft blob',
        draftId: draft.body.data.draft.id,
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            blobHash: draftFile?.blobHash,
            language: 'typescript',
          },
        ],
      },
    });

    expect(publish.status).toBe(200);
    expect(publishedArtifacts).toHaveLength(1);
    expect(publishedArtifacts[0].code).toContain('ctx.render("draft blob");');
  });

  it('validates RunJS compile inputs against VSC size limits before compiling', () => {
    expect(() =>
      assertRunJSCompileInputLimits(
        Array.from({ length: maxFilesPerRepo + 1 }, (_, index) => ({
          path: `src/file-${String(index).padStart(3, '0')}.ts`,
          operation: 'upsert' as const,
          content: '',
        })),
      ),
    ).toThrowError(expect.objectContaining({ code: 'REPO_LIMIT_EXCEEDED' }));

    expect(() =>
      assertRunJSCompileInputLimits([
        {
          path: 'src/main.tsx',
          operation: 'upsert',
          content: 'x'.repeat(maxFileSize + 1),
        },
      ]),
    ).toThrowError(expect.objectContaining({ code: 'FILE_TOO_LARGE' }));

    expect(() =>
      assertRunJSCompileInputLimits(
        Array.from({ length: Math.floor(maxRepoTextSize / maxFileSize) + 1 }, (_, index) => ({
          path: `src/large-${String(index).padStart(2, '0')}.ts`,
          operation: 'upsert' as const,
          content: 'x'.repeat(maxFileSize),
        })),
      ),
    ).toThrowError(expect.objectContaining({ code: 'REPO_LIMIT_EXCEEDED' }));
  });

  it('rejects RunJS compile preview inputs guarded by VSC file validation', async () => {
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_compile_limits',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:compile-limits:v1',
      writePublished: () => ({
        ownerFingerprint: 'owner:compile-limits:v2',
      }),
      readLegacy: () => ({
        label: 'JS block / Compile limits',
        code: 'return limited;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:compile-limits:v1',
        surfaceStyle: 'value',
        language: 'typescript',
      }),
    });

    const tooManyFiles = await agent.resource('runJSSources').compilePreview({
      values: {
        locator,
        files: [
          {
            path: 'src/Main.tsx',
            operation: 'upsert',
            content: 'export const value = 1;',
            language: 'typescript',
          },
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'export const value = 2;',
            language: 'typescript',
          },
        ],
        entryPath: 'src/Main.tsx',
      },
    });
    expect(tooManyFiles.status).toBe(400);
    expect(tooManyFiles.body.errors[0]).toMatchObject({
      code: 'PATH_INVALID',
      status: 400,
    });
  });

  it('rejects invalid RunJS publish inputs before creating a commit or writing the owner', async () => {
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:publish-limits:v1',
      readLegacy: () => ({
        label: 'JS block / Publish limits',
        code: 'return limited;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:publish-limits:v1',
        surfaceStyle: 'value',
        language: 'typescript',
      }),
      writePublished: ({ artifact }) => {
        publishedArtifacts.push(artifact);
        return {
          ownerFingerprint: 'owner:publish-limits:v2',
        };
      },
    });
    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();

    const response = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_publish_limits',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:publish-limits:v1',
        message: 'Reject invalid RunJS files',
        files: [
          {
            path: 'src/Main.tsx',
            operation: 'upsert',
            content: 'export const value = 1;',
            language: 'typescript',
          },
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'export const value = 2;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toMatchObject({
      code: 'PATH_INVALID',
      status: 400,
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    expect(publishedArtifacts).toHaveLength(0);
  });

  it('restores a previous version as draft without changing commits or published ref', async () => {
    let ownerFingerprint = 'owner:restore:v1';
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_restore',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Restore',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: () => {
        ownerFingerprint = 'owner:restore:v2';
        return {
          ownerFingerprint,
        };
      },
    });

    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    const initialCommitId = open.body.data.repository.publishedCommitId;
    const publish = await agent.resource('runJSSources').publish({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: initialCommitId,
        basePublishedCommitId: initialCommitId,
        baseOwnerFingerprint: 'owner:restore:v1',
        message: 'Publish restore target',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("published");',
            language: 'typescript',
          },
        ],
      },
    });

    expect(publish.status).toBe(200);
    const publishedCommitId = publish.body.data.commit.id;
    const initialVersionAfterPublish = await agent.resource('runJSSources').getVersion({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        commitId: initialCommitId,
      },
    });
    const publishDiff = await agent.resource('runJSSources').diffVersion({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        commitId: publishedCommitId,
      },
    });

    expect(initialVersionAfterPublish.status).toBe(200);
    expect(initialVersionAfterPublish.body.data.commit).toMatchObject({
      id: initialCommitId,
      isPublished: false,
    });
    expect(publishDiff.status).toBe(200);
    expect(publishDiff.body.data).toMatchObject({
      fromCommitId: initialCommitId,
      toCommitId: publishedCommitId,
      fromIsPublished: false,
      toIsPublished: true,
    });

    const staleDraft = await agent.resource('runJSSources').saveDraft({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: publishedCommitId,
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("stale draft");',
            language: 'typescript',
          },
          {
            path: 'src/extra.ts',
            operation: 'upsert',
            content: 'export const stale = true;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(staleDraft.status).toBe(200);
    const commitCountBeforeRestore = await app.db.getRepository('vscFileCommits').count();
    const restore = await agent.resource('runJSSources').restoreAsDraft({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        sourceCommitId: initialCommitId,
        baseCommitId: publishedCommitId,
      },
    });

    expect(restore.status).toBe(200);
    expect(restore.body.data.files.map((file) => file.path)).toEqual([runJSManifestPath, 'src/main.tsx']);
    const restoredMainFile = restore.body.data.files.find((file) => file.path === 'src/main.tsx');
    expect(restoredMainFile).toMatchObject({
      content: 'ctx.render("legacy");',
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeRestore);

    const repository = await app.db.getRepository('vscFileRepositories').findOne({
      filterByTk: open.body.data.repository.id,
    });
    expect(repository?.get('publishedCommitId')).toBe(publishedCommitId);

    const draftBlob = await app.db.getRepository('vscFileBlobs').findOne({
      filterByTk: restoredMainFile?.blobHash,
    });
    expect(draftBlob?.get('content')).toBe('ctx.render("legacy");');
  });

  it('rebases an existing stale active draft onto the latest published base', async () => {
    let ownerFingerprint = 'owner:rebase:v1';
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_rebase',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Rebase',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: () => {
        ownerFingerprint = 'owner:rebase:v2';
        return {
          ownerFingerprint,
        };
      },
    });

    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    const initialCommitId = open.body.data.repository.publishedCommitId;

    const staleDraft = await agent.resource('runJSSources').saveDraft({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: initialCommitId,
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("local draft");',
            language: 'typescript',
          },
        ],
      },
    });
    expect(staleDraft.status).toBe(200);

    const publish = await agent.resource('runJSSources').publish({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: initialCommitId,
        basePublishedCommitId: initialCommitId,
        baseOwnerFingerprint: 'owner:rebase:v1',
        message: 'Publish remote change',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("remote");',
            language: 'typescript',
          },
          {
            path: 'src/remote.ts',
            operation: 'upsert',
            content: 'export const remote = true;',
            language: 'typescript',
          },
        ],
      },
    });
    expect(publish.status).toBe(200);

    const rebase = await agent.resource('runJSSources').rebaseDraft({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: publish.body.data.commit.id,
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("local draft");',
            language: 'typescript',
          },
        ],
      },
    });

    expect(rebase.status).toBe(200);
    expect(rebase.body.data.draft).toMatchObject({
      baseCommitId: publish.body.data.commit.id,
      status: 'active',
    });
    expect(rebase.body.data.files.map((file) => file.path)).toEqual(['src/main.tsx']);
    expect(rebase.body.data.files[0]).toMatchObject({
      content: 'ctx.render("local draft");',
    });

    const reopened = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    expect(reopened.body.data.draft).toMatchObject({
      baseCommitId: publish.body.data.commit.id,
    });
    expect(reopened.body.data.files.map((file) => file.path)).toEqual([
      runJSManifestPath,
      'src/main.tsx',
      'src/remote.ts',
    ]);
  });

  it('rolls back publish when owner write or published ref update fails', async () => {
    const ownerFingerprint = 'owner:rollback:v1';
    let writePublishedCalls = 0;
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_rollback',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Rollback',
        code: 'ctx.render("legacy");',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: () => {
        writePublishedCalls += 1;
        throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'forced owner write failure');
      },
    });

    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    const initialCommitId = open.body.data.repository.publishedCommitId;
    const commitCountBeforeWriteFailure = await app.db.getRepository('vscFileCommits').count();
    const writeFailure = await agent.resource('runJSSources').publish({
      values: {
        locator,
        repoId: open.body.data.repository.id,
        baseCommitId: initialCommitId,
        basePublishedCommitId: initialCommitId,
        baseOwnerFingerprint: 'owner:rollback:v1',
        message: 'Fail owner write',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'ctx.render("write failure");',
            language: 'typescript',
          },
        ],
      },
    });

    expect(writeFailure.status).toBe(409);
    expect(writeFailure.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
    });
    expect(writePublishedCalls).toBe(1);
    expect(ownerFingerprint).toBe('owner:rollback:v1');
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeWriteFailure);

    let pushTransaction: unknown;
    let updateRefTransaction: unknown;
    const originalPush = VscFileService.prototype.push;
    const pushSpy = vi.spyOn(VscFileService.prototype, 'push').mockImplementation(function capturePushTransaction(
      this: VscFileService,
      input,
      serviceCtx = {},
    ) {
      pushTransaction = serviceCtx.transaction;
      return originalPush.call(this, input, serviceCtx);
    });
    const updateRefSpy = vi
      .spyOn(VscFileService.prototype, 'updateRef')
      .mockImplementation(async (_input, serviceCtx = {}) => {
        updateRefTransaction = serviceCtx.transaction;
        throw new VscError('BASE_COMMIT_OUTDATED', 'forced updateRef failure');
      });

    try {
      const updateRefFailure = await agent.resource('runJSSources').publish({
        values: {
          locator,
          repoId: open.body.data.repository.id,
          baseCommitId: initialCommitId,
          basePublishedCommitId: initialCommitId,
          baseOwnerFingerprint: 'owner:rollback:v1',
          message: 'Fail ref update',
          files: [
            {
              path: 'src/main.tsx',
              operation: 'upsert',
              content: 'ctx.render("ref failure");',
              language: 'typescript',
            },
          ],
        },
      });

      expect(updateRefFailure.status).toBe(409);
      expect(updateRefFailure.body.errors[0]).toMatchObject({
        code: 'BASE_COMMIT_OUTDATED',
      });
    } finally {
      updateRefSpy.mockRestore();
      pushSpy.mockRestore();
    }

    expect(pushTransaction).toBeTruthy();
    expect(updateRefTransaction).toBe(pushTransaction);
    expect(writePublishedCalls).toBe(1);
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeWriteFailure);
  });

  it('publishes a RunJS source through VSC and rejects stale owner fingerprints before creating a commit', async () => {
    let ownerFingerprint = 'owner:fingerprint:v1';
    const publishedArtifacts: Array<{ artifact: RunJSRuntimeArtifact; commitId: string }> = [];

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Write JavaScript',
        code: 'return ctx;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: ({ artifact, commitId }) => {
        publishedArtifacts.push({ artifact, commitId });
        ownerFingerprint = 'owner:fingerprint:v2';
        return {
          ownerFingerprint: 'owner:fingerprint:adapter-return',
        };
      },
    });

    const publishResponse = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:fingerprint:v1',
        message: 'Update RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'return next;',
            blobHash: 'b'.repeat(64),
            size: 999,
            language: 'typescript',
          },
          {
            path: 'src/forged.ts',
            operation: 'upsert',
            content: 'return forged;',
            language: 'typescript',
          },
          {
            path: runJSManifestPath,
            operation: 'upsert',
            content: JSON.stringify({
              schemaVersion: 1,
              entry: 'src/forged.ts',
              runtimeVersion: 'v2',
              surfaceStyle: 'render',
            }),
            language: 'json',
          },
        ],
        artifact: {
          code: { forged: true },
          diagnostics: 'not-diagnostics',
          entryPath: '../forged.ts',
          filesHash: 123,
          version: ['workflow-js'],
        },
      },
    });

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.data).toMatchObject({
      locatorKind: 'flowModel.step',
      repository: {
        publishedCommitId: publishResponse.body.data.commit.id,
      },
      artifact: {
        entryPath: 'src/main.tsx',
      },
      ownerFingerprint: 'owner:fingerprint:v2',
      writeResult: {
        ownerFingerprint: 'owner:fingerprint:v2',
      },
    });
    expect(publishedArtifacts).toHaveLength(1);
    expect(publishedArtifacts[0]).toMatchObject({
      artifact: {
        code: 'return next;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        metadata: {
          repoId: publishResponse.body.data.repository.id,
        },
      },
      commitId: publishResponse.body.data.commit.id,
    });
    const expectedManifestContent = `${JSON.stringify(
      {
        schemaVersion: 1,
        entry: 'src/main.tsx',
        runtimeVersion: 'v2',
        surfaceStyle: 'render',
        compiler: {
          module: 'virtual-esm',
          jsx: true,
        },
      },
      null,
      2,
    )}\n`;
    expect(publishResponse.body.data.artifact.filesHash).toBe(
      buildRunJSFilesHash([
        {
          path: runJSManifestPath,
          operation: 'upsert',
          content: expectedManifestContent,
          language: 'json',
        },
        {
          path: 'src/forged.ts',
          operation: 'upsert',
          content: 'return forged;',
          language: 'typescript',
        },
        {
          path: 'src/main.tsx',
          operation: 'upsert',
          content: 'return next;',
          language: 'typescript',
        },
      ]),
    );
    const publishedVersion = await agent.resource('runJSSources').getVersion({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        repoId: publishResponse.body.data.repository.id,
        commitId: publishResponse.body.data.commit.id,
        includeFiles: true,
      },
    });
    expect(publishedVersion.status).toBe(200);
    expect(publishedVersion.body.data.files).toContainEqual(
      expect.objectContaining({
        path: runJSManifestPath,
        content: expectedManifestContent,
      }),
    );
    const persistedCommit = await app.db.getRepository('vscFileCommits').findOne({
      filterByTk: publishResponse.body.data.commit.id,
    });
    expect(persistedCommit?.get('metadata')).toMatchObject({
      ownerFingerprint: 'owner:fingerprint:v2',
      baseOwnerFingerprint: 'owner:fingerprint:v1',
      entry: 'src/main.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      runtimeCodeHash: publishResponse.body.data.artifact.runtimeCodeHash,
    });

    const commitCountAfterPublish = await app.db.getRepository('vscFileCommits').count();
    ownerFingerprint = 'owner:fingerprint:external';

    const staleOpen = await agent.resource('runJSSources').open({
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

    expect(staleOpen.status).toBe(409);
    expect(staleOpen.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
    });

    const staleResponse = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        repoId: publishResponse.body.data.repository.id,
        baseCommitId: publishResponse.body.data.commit.id,
        basePublishedCommitId: publishResponse.body.data.commit.id,
        baseOwnerFingerprint: 'owner:fingerprint:v1',
        message: 'Update stale RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'return stale;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(staleResponse.status).toBe(409);
    expect(staleResponse.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountAfterPublish);
    expect(publishedArtifacts).toHaveLength(1);
  });

  it('publishes legacy open callers that omit repo and base fields', async () => {
    let ownerFingerprint = 'owner:legacy:v1';
    const locator = {
      kind: 'flowModel.step' as const,
      modelUid: 'fm_legacy_publish',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
    };

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Legacy publish',
        code: 'return initial;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: () => {
        ownerFingerprint = 'owner:legacy:v2';
        return {};
      },
    });

    const open = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });

    expect(open.status).toBe(200);

    const publish = await agent.resource('runJSSources').publish({
      values: {
        locator,
        baseOwnerFingerprint: open.body.data.ownerFingerprint,
        message: 'Update legacy caller',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'return updated;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(publish.status).toBe(200);
    expect(publish.body.data).toMatchObject({
      ownerFingerprint: 'owner:legacy:v2',
      repository: {
        id: open.body.data.repository.id,
        publishedCommitId: publish.body.data.commit.id,
      },
    });

    const reopened = await agent.resource('runJSSources').open({
      values: {
        locator,
      },
    });
    const secondPublish = await agent.resource('runJSSources').publish({
      values: {
        locator,
        baseOwnerFingerprint: reopened.body.data.ownerFingerprint,
        message: 'Update legacy caller again',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'return updatedAgain;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(reopened.status).toBe(200);
    expect(secondPublish.status).toBe(200);
    expect(secondPublish.body.data.repository).toMatchObject({
      id: open.body.data.repository.id,
      publishedCommitId: secondPublish.body.data.commit.id,
    });
  });

  it('rolls back the VSC commit when the owner changes after the pre-push fingerprint check', async () => {
    let getFingerprintCalls = 0;
    let writePublishedCalled = false;

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => {
        getFingerprintCalls += 1;
        return getFingerprintCalls === 1 ? 'owner:mid-publish:v1' : 'owner:mid-publish:external';
      },
      readLegacy: () => ({
        label: 'JS block / Mid-publish guard',
        code: 'return initial;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:mid-publish:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: () => {
        writePublishedCalled = true;
        return {
          ownerFingerprint: 'owner:mid-publish:v2',
        };
      },
    });

    const commitCountBeforePublish = await app.db.getRepository('vscFileCommits').count();
    const response = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_mid_publish',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:mid-publish:v1',
        message: 'Update guarded RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: 'return guarded;',
            language: 'typescript',
          },
        ],
      },
    });

    expect(response.status).toBe(409);
    expect(response.body.errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_OWNER_OUTDATED',
      status: 409,
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePublish);
    expect(writePublishedCalled).toBe(false);
  });

  it('publishes an explicit empty RunJS source without dropping the artifact code', async () => {
    let ownerFingerprint = 'owner:empty:v1';
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => ownerFingerprint,
      readLegacy: () => ({
        label: 'JS block / Empty JavaScript',
        code: 'return initial;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint,
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: ({ artifact }) => {
        publishedArtifacts.push(artifact);
        ownerFingerprint = 'owner:empty:v2';
        return {
          ownerFingerprint,
        };
      },
    });

    const response = await agent.resource('runJSSources').publish({
      values: {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_empty',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:empty:v1',
        message: 'Clear RunJS source',
        files: [
          {
            path: 'src/main.tsx',
            operation: 'upsert',
            content: '',
            language: 'typescript',
          },
        ],
      },
    });

    expect(response.status).toBe(200);
    expect(publishedArtifacts).toHaveLength(1);
    expect(publishedArtifacts[0]).toMatchObject({
      code: '',
      entryPath: 'src/main.tsx',
    });
    expect(response.body.data.artifact.runtimeCodeHash).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('rejects a supplied repository that does not belong to the RunJS source locator', async () => {
    const publishedArtifacts: RunJSRuntimeArtifact[] = [];

    getPlugin().registerRunJSSourceAdapter({
      kind: 'flowModel.step',
      assertCanRead: () => {},
      assertCanWrite: () => {},
      getFingerprint: () => 'owner:repo:v1',
      readLegacy: () => ({
        label: 'JS block / Repository guard',
        code: 'return initial;',
        version: 'v2',
        entryPath: 'src/main.tsx',
        ownerFingerprint: 'owner:repo:v1',
        surfaceStyle: 'render',
        language: 'typescript',
      }),
      writePublished: ({ artifact }) => {
        publishedArtifacts.push(artifact);
        return {
          ownerFingerprint: 'owner:repo:v2',
        };
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
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_repo_guard',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        },
        repoId: wrongRepositoryResponse.body.data.repository.id,
        baseCommitId: null,
        basePublishedCommitId: null,
        baseOwnerFingerprint: 'owner:repo:v1',
        message: 'Update guarded RunJS source',
        files: [
          {
            path: 'src/main.tsx',
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

  function getPlugin(): PluginVscFileServer {
    return app.pm.get(PluginVscFileServer) as PluginVscFileServer;
  }
});
