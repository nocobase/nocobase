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

import { VscError } from '../../shared/errors';
import type { RunJSRuntimeArtifact, RunJSSourceAdapterContext } from '../../shared/runjs-source-types';
import PluginVscFileServer from '../plugin';
import { runJSSourceActionNames } from '../runjs-sources';
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
      files: [
        {
          path: 'src/main.tsx',
          content: 'ctx.render("legacy");',
        },
      ],
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
    expect(version.body.data.files).toEqual([
      expect.objectContaining({
        path: 'src/main.tsx',
        content: 'ctx.render("legacy");',
      }),
    ]);

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
    expect(rootDiff.body.data.diff.summary.added).toBe(1);
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
    expect(restore.body.data.files.map((file) => file.path)).toEqual(['src/main.tsx']);
    expect(restore.body.data.files[0]).toMatchObject({
      content: 'ctx.render("legacy");',
    });
    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforeRestore);

    const repository = await app.db.getRepository('vscFileRepositories').findOne({
      filterByTk: open.body.data.repository.id,
    });
    expect(repository?.get('publishedCommitId')).toBe(publishedCommitId);

    const draftBlob = await app.db.getRepository('vscFileBlobs').findOne({
      filterByTk: restore.body.data.files[0].blobHash,
    });
    expect(draftBlob?.get('content')).toBe('ctx.render("legacy");');
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
            language: 'typescript',
          },
        ],
        artifact: {
          code: 'return forged;',
          diagnostics: [],
          entryPath: 'src/main.tsx',
          filesHash: 'forged-files-hash',
          version: 'v2',
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
    expect(publishResponse.body.data.artifact.filesHash).not.toBe('forged-files-hash');

    const commitCountAfterPublish = await app.db.getRepository('vscFileCommits').count();
    ownerFingerprint = 'owner:fingerprint:external';

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
