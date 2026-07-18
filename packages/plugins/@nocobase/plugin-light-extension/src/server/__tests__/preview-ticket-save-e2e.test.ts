/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginVscFileServer from '@nocobase/plugin-vsc-file';
import { createMockServer, type MockServer } from '@nocobase/test';

import type { LightExtensionSaveSourceInput, TrustedPreviewTicketSummary } from '../../shared/types';
import PluginLightExtensionServer from '../plugin';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionCanonicalWorkspaceBuilder } from '../services/LightExtensionCanonicalWorkspace';
import { LightExtensionCompilePreviewService } from '../services/LightExtensionCompilePreviewService';
import { LightExtensionEntryService } from '../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import {
  LightExtensionPreviewTicketStore,
  LightExtensionPreviewTicketVerifier,
} from '../services/LightExtensionPreviewTicket';
import { LightExtensionRepoService } from '../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';
import { LightExtensionTrustedCompileCacheService } from '../services/LightExtensionTrustedCompileCacheService';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import { PublishCompiledEntriesService } from '../services/PublishCompiledEntriesService';

describe('trusted Preview Ticket to Save integration', () => {
  let app: MockServer;
  let repoService: LightExtensionRepoService;
  let previewService: LightExtensionCompilePreviewService;
  let runtimeCompileService: LightExtensionRuntimeCompileService;
  let compilerBridge: LightExtensionWorkspaceCompilerBridge;
  let ticketStore: LightExtensionPreviewTicketStore;
  let ticketVerifier: LightExtensionPreviewTicketVerifier;
  let trustedCompileCache: LightExtensionTrustedCompileCacheService;
  let fileService: LightExtensionFileService;
  let entryService: LightExtensionEntryService;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: [PluginVscFileServer, PluginLightExtensionServer],
    });
    const auditService = new LightExtensionAuditService(app.db);
    const permissionService = new LightExtensionPermissionService(auditService);
    const validator = new LightExtensionValidator();
    repoService = new LightExtensionRepoService(app.db, auditService, permissionService, undefined, validator);
    fileService = new LightExtensionFileService(
      app.db,
      auditService,
      permissionService,
      repoService,
      undefined,
      validator,
    );
    entryService = new LightExtensionEntryService(app.db, fileService, repoService, validator);
    compilerBridge = new LightExtensionWorkspaceCompilerBridge(auditService, permissionService);
    trustedCompileCache = new LightExtensionTrustedCompileCacheService(app.db);
    const cache = await app.cacheManager.createCache({
      name: 'light-extension-preview-ticket-save-e2e',
      prefix: 'light-extension:preview-ticket-save-e2e',
      store: 'memory',
    });
    ticketStore = new LightExtensionPreviewTicketStore(cache);
    ticketVerifier = new LightExtensionPreviewTicketVerifier(ticketStore, trustedCompileCache);
    previewService = new LightExtensionCompilePreviewService(
      app.db,
      auditService,
      fileService,
      permissionService,
      compilerBridge,
      validator,
      undefined,
      {
        canonicalWorkspaceBuilder: new LightExtensionCanonicalWorkspaceBuilder(app.db),
        previewTicketStore: ticketStore,
        trustedCompileCache,
      },
    );
    runtimeCompileService = createRuntimeCompileService();
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('reuses a valid ticket with zero Save compilation and consumes it only after commit', async () => {
    const repo = await createRepo('Valid Ticket Reuse');
    const compileEntry = vi.spyOn(compilerBridge, 'compileEntry');
    const commitCountBeforePreview = await app.db.getRepository('vscFileCommits').count();
    const ticket = await issueTicket(repo.id, repo.headCommitId, 'V1');

    await expect(app.db.getRepository('vscFileCommits').count()).resolves.toBe(commitCountBeforePreview);
    await expect(app.db.getRepository('lightExtensionEntries').count({ filter: { repoId: repo.id } })).resolves.toBe(0);
    await expect(app.db.getRepository('lightExtensionReferences').count({ filter: { repoId: repo.id } })).resolves.toBe(
      0,
    );
    expect(compileEntry).toHaveBeenCalledTimes(1);

    const saved = await runtimeCompileService.saveSource(saveInput(repo.id, repo.headCommitId, 'V1', ticket, true), {
      actorUserId: 'user-1',
    });

    expect(saved.compile.entries).toEqual([
      expect.objectContaining({
        entryName: 'sales-kpi',
        status: 'success',
        execution: 'reused',
      }),
    ]);
    expect(compileEntry).toHaveBeenCalledTimes(1);
    await expect(ticketStore.read(ticket)).resolves.toEqual({ status: 'missing' });
    const entry = await app.db.getRepository('lightExtensionEntries').findOne({
      filter: { repoId: repo.id, entryName: 'sales-kpi' },
    });
    expect(entry?.get('compiledCommitId')).toBe(saved.commit.id);
    await expect(app.db.getRepository('lightExtensionRuntimeArtifacts').count()).resolves.toBe(1);
    await expect(app.db.getRepository('lightExtensionCompileCache').count()).resolves.toBe(1);
  });

  it('falls back to formal compilation for an optional workspace mismatch and keeps the old ticket', async () => {
    const repo = await createRepo('Optional Ticket Mismatch');
    const compileEntry = vi.spyOn(compilerBridge, 'compileEntry');
    const ticket = await issueTicket(repo.id, repo.headCommitId, 'V1');

    const saved = await runtimeCompileService.saveSource(saveInput(repo.id, repo.headCommitId, 'V2', ticket, false), {
      actorUserId: 'user-1',
    });

    expect(saved.compile.entries).toEqual([
      expect.objectContaining({
        entryName: 'sales-kpi',
        execution: 'compiled',
      }),
    ]);
    expect(compileEntry).toHaveBeenCalledTimes(2);
    await expect(ticketStore.read(ticket)).resolves.toMatchObject({ status: 'found' });
    const pulled = await fileService.pullCommit({
      repoId: repo.id,
      commitId: saved.commit.id,
      includeContent: 'all',
    });
    expect(pulled.files?.find((file) => file.path.endsWith('/index.tsx'))?.content).toContain('V2');
  });

  it('rejects a required workspace mismatch before compilation or any persistent Save write', async () => {
    const repo = await createRepo('Required Ticket Mismatch');
    const compileEntry = vi.spyOn(compilerBridge, 'compileEntry');
    const ticket = await issueTicket(repo.id, repo.headCommitId, 'V1');
    const before = await readPersistentSaveState(app, repo.id);

    await expect(
      runtimeCompileService.saveSource(saveInput(repo.id, repo.headCommitId, 'V2', ticket, true), {
        actorUserId: 'user-1',
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PREVIEW_TICKET_INVALID',
      status: 409,
    });

    expect(compileEntry).toHaveBeenCalledTimes(1);
    await expect(readPersistentSaveState(app, repo.id)).resolves.toEqual(before);
    await expect(ticketStore.read(ticket)).resolves.toMatchObject({ status: 'found' });
  });

  it('rolls back Source, Entry, Artifact publication, and References without consuming the ticket', async () => {
    const repo = await createRepo('Ticket Publish Rollback');
    const compileEntry = vi.spyOn(compilerBridge, 'compileEntry');
    const ticket = await issueTicket(repo.id, repo.headCommitId, 'V1');
    const before = await readPersistentSaveState(app, repo.id);
    const publisher = PublishCompiledEntriesService.forDatabase(app.db);
    const publish = publisher.publishCompiledEntries.bind(publisher);
    vi.spyOn(publisher, 'publishCompiledEntries').mockImplementation(async (batch, transaction) => {
      await publish(batch, transaction);
      throw new Error('forced publish rollback after compiled entries');
    });
    const failingRuntime = createRuntimeCompileService(publisher);

    await expect(
      failingRuntime.saveSource(saveInput(repo.id, repo.headCommitId, 'V1', ticket, true), {
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('forced publish rollback after compiled entries');

    expect(compileEntry).toHaveBeenCalledTimes(1);
    await expect(readPersistentSaveState(app, repo.id)).resolves.toEqual(before);
    await expect(ticketStore.read(ticket)).resolves.toMatchObject({ status: 'found' });

    const retried = await runtimeCompileService.saveSource(saveInput(repo.id, repo.headCommitId, 'V1', ticket, true), {
      actorUserId: 'user-1',
    });
    expect(retried.compile.entries[0]).toMatchObject({ execution: 'reused' });
    expect(compileEntry).toHaveBeenCalledTimes(1);
    await expect(ticketStore.read(ticket)).resolves.toEqual({ status: 'missing' });
  });

  it('returns standard outdated when Head changes between prepare and publish, before any stale ticket can publish', async () => {
    const repo = await createRepo('Ticket Prepare Publish Head Race');
    const compileEntry = vi.spyOn(compilerBridge, 'compileEntry');
    const ticket = await issueTicket(repo.id, repo.headCommitId, 'V1');
    const prepared = await runtimeCompileService.prepareSaveSource(
      saveInput(repo.id, repo.headCommitId, 'V1', ticket, true),
      { actorUserId: 'user-1' },
    );
    expect(prepared.previewTicketToConsume).toBe(ticket);
    expect(compileEntry).toHaveBeenCalledTimes(1);

    const winner = await runtimeCompileService.saveSource(saveInput(repo.id, repo.headCommitId, 'Winner'), {
      actorUserId: 'user-2',
    });
    expect(compileEntry).toHaveBeenCalledTimes(2);

    await expect(
      app.db.sequelize.transaction((transaction) =>
        runtimeCompileService.publishPreparedSave(prepared, {
          actorUserId: 'user-1',
          transaction,
        }),
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
      status: 409,
      details: {
        expectedHeadCommitId: repo.headCommitId,
        currentHeadCommitId: winner.commit.id,
      },
    });

    await expect(repoService.getRepo(repo.id)).resolves.toMatchObject({ headCommitId: winner.commit.id });
    await expect(ticketStore.read(ticket)).resolves.toMatchObject({ status: 'found' });
  });

  function createRuntimeCompileService(publisher?: PublishCompiledEntriesService): LightExtensionRuntimeCompileService {
    return new LightExtensionRuntimeCompileService(app.db, fileService, entryService, compilerBridge, undefined, {
      trustedCompileCache,
      previewTicketVerifier: ticketVerifier,
      ...(publisher ? { publishCompiledEntries: publisher } : {}),
    });
  }

  async function createRepo(name: string) {
    return repoService.createRepo({
      name,
      initialFiles: workspaceFiles('Initial'),
    });
  }

  async function issueTicket(repoId: string, expectedHeadCommitId: string | null, version: string): Promise<string> {
    const preview = await previewService.compileWorkspacePreview(
      {
        repoId,
        expectedHeadCommitId,
        issueSaveTicket: true,
        runtimeVersion: 'v2',
        files: workspaceFiles(version),
      },
      { actorUserId: 'user-1' },
    );
    expect(preview).toMatchObject({
      accepted: true,
      httpStatus: 200,
      ticket: {
        ticket: expect.any(String),
        expiresAt: expect.any(String),
      },
    });
    return (preview.ticket as TrustedPreviewTicketSummary).ticket;
  }
});

function saveInput(
  repoId: string,
  expectedHeadCommitId: string | null,
  version: string,
  previewTicket?: string,
  requirePreviewTicket?: boolean,
): LightExtensionSaveSourceInput {
  return {
    repoId,
    expectedHeadCommitId,
    message: `Save ${version}`,
    files: [workspaceFiles(version)[0]],
    ...(previewTicket ? { previewTicket } : {}),
    ...(typeof requirePreviewTicket === 'boolean' ? { requirePreviewTicket } : {}),
  };
}

function workspaceFiles(version: string) {
  return [
    {
      path: 'src/client/js-blocks/sales-kpi/index.tsx',
      content: `const version = '${version}';\nctx.render(<div>{version}</div>);\n`,
      language: 'typescript',
    },
    {
      path: 'src/client/js-blocks/sales-kpi/entry.json',
      content: JSON.stringify({ schemaVersion: 1, key: 'sales-kpi', title: 'Sales KPI' }),
      language: 'json',
    },
  ];
}

async function readPersistentSaveState(app: MockServer, appRepoId: string) {
  const repo = await app.db.getRepository('lightExtensionRepos').findOne({ filterByTk: appRepoId });
  return {
    headCommitId: repo?.get('headCommitId') || null,
    commitCount: await app.db.getRepository('vscFileCommits').count(),
    treeCount: await app.db.getRepository('vscFileTrees').count(),
    blobCount: await app.db.getRepository('vscFileBlobs').count(),
    entryCount: await app.db.getRepository('lightExtensionEntries').count({ filter: { repoId: appRepoId } }),
    artifactCount: await app.db.getRepository('lightExtensionRuntimeArtifacts').count(),
    compileCacheCount: await app.db.getRepository('lightExtensionCompileCache').count(),
    referenceCount: await app.db.getRepository('lightExtensionReferences').count({ filter: { repoId: appRepoId } }),
  };
}
