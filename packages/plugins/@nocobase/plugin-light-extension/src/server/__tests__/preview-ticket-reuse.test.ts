/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Model } from '@nocobase/database';
import {
  hashRunJSEntryDependencyManifest,
  type RunJSEntryDependencyManifestV1,
  type RunJSRuntimeArtifact,
} from '@nocobase/runjs';
import { vi } from 'vitest';

import { LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT } from '../../constants';
import type { LightExtensionWorkspacePreviewInput } from '../../shared/types';
import swaggerDocument from '../../swagger';
import { createLightExtensionFilesResource } from '../resources/lightExtensionFiles';
import { createLightExtensionsResource } from '../resources/lightExtensions';
import { LightExtensionAuditService } from '../services/LightExtensionAuditService';
import { LightExtensionCanonicalWorkspaceBuilder } from '../services/LightExtensionCanonicalWorkspace';
import { buildLightExtensionCompileKey, type CompileInputManifest } from '../services/LightExtensionCompileKey';
import { LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY } from '../services/LightExtensionCompileContract';
import { LightExtensionCompilePreviewService } from '../services/LightExtensionCompilePreviewService';
import { LightExtensionPermissionService } from '../services/LightExtensionPermissionService';
import {
  LIGHT_EXTENSION_PREVIEW_TICKET_DEFAULT_TTL_MS,
  LightExtensionPreviewTicketStore,
  LightExtensionPreviewTicketVerifier,
  type LightExtensionPreviewTicketVerifyInput,
  type TrustedPreviewTicketIssueInput,
} from '../services/LightExtensionPreviewTicket';
import { LightExtensionTrustedCompileCacheService } from '../services/LightExtensionTrustedCompileCacheService';
import type { LightExtensionWorkspaceCompilerBridge } from '../services/LightExtensionWorkspaceCompilerBridge';
import type { LightExtensionFileService } from '../services/LightExtensionFileService';
import type { LightExtensionRuntimeCompileService } from '../services/LightExtensionRuntimeCompileService';

const fixedTicket = `lept_${'a'.repeat(43)}`;

describe('trusted preview ticket reuse foundation', () => {
  it('canonicalizes preview files with the VSC PreparedTree identity used by Save candidates', async () => {
    const db = createFakeDatabase().db;
    const builder = new LightExtensionCanonicalWorkspaceBuilder(db);
    const first = await builder.build([
      {
        path: 'src\\client\\js-blocks\\sales\\index.tsx',
        content: '\ufeffconst label = "销售";\r\nctx.render(label);\r',
      },
      {
        path: 'src/client/js-blocks/sales/entry.json',
        content: '{"schemaVersion":1,"key":"sales"}\r\n',
      },
    ]);
    const second = await builder.build([
      {
        path: 'src/client/js-blocks/sales/index.tsx',
        content: 'const label = "销售";\nctx.render(label);\n',
      },
      {
        path: 'src/client/js-blocks/sales/entry.json',
        content: '{"schemaVersion":1,"key":"sales"}\n',
      },
    ]);

    expect(first.workspaceDigest).toBe(first.treeHash);
    expect(first.workspaceDigest).toBe(second.workspaceDigest);
    expect(first.files.map((file) => file.path)).toEqual([
      'src/client/js-blocks/sales/entry.json',
      'src/client/js-blocks/sales/index.tsx',
    ]);
    expect(first.files[1].content).toBe('const label = "销售";\nctx.render(label);\n');
    expect(first.files[1].size).toBe(Buffer.byteLength(first.files[1].content, 'utf8'));
    expect(first.files[1].blobHash).toBe(second.files[1].blobHash);
  });

  it('persists only server compiler output into the Task 07 trusted cache and verifies every mapping field', async () => {
    const fake = createFakeDatabase();
    const cache = new LightExtensionTrustedCompileCacheService(fake.db);
    const compileInput = createCompileInput();
    const artifact = createArtifact();
    const persisted = await cache.persistAcceptedCompile({
      ...compileInput,
      artifact,
      diagnostics: [{ code: 'preview_warning', severity: 'warning', message: 'warning' }],
    });

    expect(persisted.artifactHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(fake.compileCache.rows).toHaveLength(1);
    expect(fake.runtimeArtifacts.rows).toHaveLength(1);
    expect(JSON.stringify(fake.compileCache.rows[0])).not.toMatch(/server compiled code|sourceMap|content/u);
    expect(fake.runtimeArtifacts.rows[0]).toMatchObject({
      artifactHash: persisted.artifactHash,
      code: artifact.code,
      sourceMap: artifact.sourceMap,
    });

    const lookup = await cache.loadVerified([
      {
        ...compileInput,
        artifactHash: persisted.artifactHash,
      },
    ]);
    expect(lookup.hits.get(compileInput.compileKey)).toMatchObject({
      artifactHash: persisted.artifactHash,
      code: artifact.code,
      inputManifest: compileInput.inputManifest,
    });
    expect(lookup.missingKeys).toEqual(new Set());
    expect(lookup.corruptKeys).toEqual(new Set());

    fake.runtimeArtifacts.rows[0].code = 'tampered code';
    const corrupt = await cache.loadVerified([compileInput]);
    expect(corrupt.hits).toHaveLength(0);
    expect(corrupt.corruptKeys).toEqual(new Set([compileInput.compileKey]));
  });

  it('rejects a non-deterministic artifact conflict for the same compileKey', async () => {
    const fake = createFakeDatabase();
    const cache = new LightExtensionTrustedCompileCacheService(fake.db);
    const compileInput = createCompileInput();
    await cache.persistAcceptedCompile({
      ...compileInput,
      artifact: createArtifact(),
      diagnostics: [],
    });

    await expect(
      cache.persistAcceptedCompile({
        ...compileInput,
        artifact: { ...createArtifact(), code: 'different server result' },
        diagnostics: [],
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_ERROR',
    });
  });

  it('stores a random opaque token under a hashed cache key with bounded TTL and no source or Artifact payload', async () => {
    const cache = new FakeTicketCache();
    let now = Date.parse('2026-07-18T00:00:00.000Z');
    const store = new LightExtensionPreviewTicketStore(cache, {
      now: () => now,
      tokenFactory: () => fixedTicket,
    });
    const summary = await store.issue(createTicketIssueInput());

    expect(summary).toEqual({
      ticket: fixedTicket,
      expiresAt: '2026-07-18T00:05:00.000Z',
    });
    expect(cache.lastTtl).toBe(LIGHT_EXTENSION_PREVIEW_TICKET_DEFAULT_TTL_MS);
    expect(cache.lastKey).not.toContain(fixedTicket);
    expect(cache.lastKey).toMatch(/^ticket:[a-f0-9]{64}$/u);
    expect(JSON.stringify(cache.lastValue)).not.toMatch(/source text|server compiled code|sourceMap|content/u);
    expect(await store.read(fixedTicket)).toMatchObject({ status: 'found' });

    now += LIGHT_EXTENSION_PREVIEW_TICKET_DEFAULT_TTL_MS;
    expect(await store.read(fixedTicket)).toEqual({ status: 'expired' });
    await store.consume(fixedTicket);
    expect(await store.read(fixedTicket)).toEqual({ status: 'missing' });

    const randomStore = new LightExtensionPreviewTicketStore(new FakeTicketCache());
    const random = await randomStore.issue(createTicketIssueInput());
    expect(random.ticket).toMatch(/^lept_[A-Za-z0-9_-]{43}$/u);
    expect(random.ticket).not.toBe(fixedTicket);
  });

  it('returns trusted compile decisions only for an exact actor, repo, Head, workspace, build, runtime, and Entry match', async () => {
    const fake = createFakeDatabase();
    const compileCache = new LightExtensionTrustedCompileCacheService(fake.db);
    const compileInput = createCompileInput();
    const persisted = await compileCache.persistAcceptedCompile({
      ...compileInput,
      artifact: createArtifact(),
      diagnostics: [],
    });
    const cache = new FakeTicketCache();
    const store = new LightExtensionPreviewTicketStore(cache, { tokenFactory: () => fixedTicket });
    await store.issue(createTicketIssueInput({ artifactHash: persisted.artifactHash }));
    const verifier = new LightExtensionPreviewTicketVerifier(store, compileCache);

    const verification = await verifier.verify(createVerifyInput());
    expect(verification.status).toBe('hit');
    if (verification.status === 'hit') {
      expect(verification.artifacts.get(compileInput.compileKey)).toMatchObject({
        artifactHash: persisted.artifactHash,
        code: 'server compiled code',
      });
    }
  });

  it.each([
    ['actor_mismatch', { actorId: 'user-2' }],
    ['repo_mismatch', { repoId: 'ler_other' }],
    ['head_mismatch', { baseHeadCommitId: 'commit-2' }],
    ['workspace_mismatch', { workspaceDigest: 'tree-other' }],
    ['compiler_mismatch', { compilerBuildId: 'build-other' }],
    ['runtime_mismatch', { runtimeContract: 'runtime-other' }],
    [
      'entry_mismatch',
      {
        entries: [
          {
            ...createExpectedEntry(),
            entryPath: 'src/client/js-blocks/other/index.tsx',
          },
        ],
      },
    ],
  ] as const)('treats %s as a safe optional miss', async (reason, patch) => {
    const fixture = await createVerifierFixture();
    await expect(fixture.verifier.verify({ ...createVerifyInput(), ...patch })).resolves.toEqual({
      status: 'miss',
      reason,
    });
  });

  it('uses one stable 409 error for required missing, expired, tampered, or mismatched tickets without leaking payload', async () => {
    const fixture = await createVerifierFixture();
    const invalidInputs: LightExtensionPreviewTicketVerifyInput[] = [
      { ...createVerifyInput(), previewTicket: undefined, requirePreviewTicket: true },
      { ...createVerifyInput(), previewTicket: `${fixedTicket}x`, requirePreviewTicket: true },
      { ...createVerifyInput(), actorId: 'other-user', requirePreviewTicket: true },
    ];

    for (const input of invalidInputs) {
      try {
        await fixture.verifier.verify(input);
        throw new Error('Expected preview ticket verification to fail');
      } catch (error) {
        expect(error).toMatchObject({
          code: 'LIGHT_EXTENSION_PREVIEW_TICKET_INVALID',
          status: 409,
        });
        expect(JSON.stringify(error)).not.toContain(fixedTicket);
        expect(JSON.stringify(error)).not.toContain('server compiled code');
      }
    }
  });

  it('falls back on trusted Artifact eviction and consumes the ticket only after explicit Save success', async () => {
    const fixture = await createVerifierFixture();
    fixture.fake.runtimeArtifacts.rows.splice(0);
    await expect(fixture.verifier.verify(createVerifyInput())).resolves.toEqual({
      status: 'miss',
      reason: 'artifact_corrupt',
    });

    fixture.fake.runtimeArtifacts.rows.push(fixture.artifactRow);
    expect((await fixture.verifier.verify(createVerifyInput())).status).toBe('hit');
    await fixture.verifier.consumeAfterSuccessfulSave(fixedTicket);
    await expect(fixture.verifier.verify(createVerifyInput())).resolves.toEqual({
      status: 'miss',
      reason: 'unknown',
    });
  });

  it('issues a ticket only after an accepted whole-workspace Preview writes every Artifact to trusted cache', async () => {
    const fake = createFakeDatabase();
    const ticketCache = new FakeTicketCache();
    const ticketStore = new LightExtensionPreviewTicketStore(ticketCache, { tokenFactory: () => fixedTicket });
    const trustedCompileCache = new LightExtensionTrustedCompileCacheService(fake.db);
    const auditService = new LightExtensionAuditService(fake.db);
    vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const fileService = createFileServiceStub();
    const compileEntry = vi.fn().mockImplementation(async (input: { entryPath: string; runtimeVersion?: string }) => ({
      accepted: true,
      diagnostics: [],
      artifact: {
        code: 'server compiled code',
        sourceMap: '{}',
        version: input.runtimeVersion || 'v2',
        entryPath: input.entryPath,
        filesHash: 'compiler-files-hash',
      },
      dependencyGraph: {
        runtime: { files: [input.entryPath], edges: [] },
        types: {
          files: [input.entryPath],
          edges: [],
          contracts: [{ id: 'runjs:surface', version: 'value' }],
        },
        unresolved: [],
      },
    }));
    const bridge = {
      compileEntry,
      getCompilerBuildIdentity: () => LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
    } as unknown as LightExtensionWorkspaceCompilerBridge;
    const service = new LightExtensionCompilePreviewService(
      fake.db,
      auditService,
      fileService,
      new LightExtensionPermissionService(auditService),
      bridge,
      undefined,
      undefined,
      {
        canonicalWorkspaceBuilder: new LightExtensionCanonicalWorkspaceBuilder(fake.db),
        previewTicketStore: ticketStore,
        trustedCompileCache,
      },
    );

    const result = await service.compileWorkspacePreview(createWorkspacePreviewInput(), { actorUserId: 'user-1' });

    expect(result).toMatchObject({
      accepted: true,
      httpStatus: 200,
      ticket: {
        ticket: fixedTicket,
        expiresAt: expect.any(String),
      },
      entries: [expect.objectContaining({ accepted: true, entryName: 'sales' })],
    });
    expect(fileService.pull).toHaveBeenCalledWith(
      { repoId: 'ler_sales', includeContent: 'none' },
      expect.objectContaining({ actorUserId: 'user-1' }),
    );
    expect(compileEntry).toHaveBeenCalledTimes(1);
    expect(fake.compileCache.rows).toHaveLength(1);
    expect(fake.runtimeArtifacts.rows).toHaveLength(1);
    const dependencyManifest = fake.compileCache.rows[0].dependencyManifest as
      | RunJSEntryDependencyManifestV1
      | undefined;
    if (!dependencyManifest) {
      throw new Error('Expected trusted Preview cache dependency manifest');
    }
    expect(dependencyManifest).toMatchObject({
      version: 1,
      entryPath: 'src/client/js-blocks/sales/index.tsx',
      runtime: { files: [expect.objectContaining({ path: 'src/client/js-blocks/sales/index.tsx' })] },
    });
    expect(fake.compileCache.rows[0].dependencyManifestHash).toBe(hashRunJSEntryDependencyManifest(dependencyManifest));
    const stored = await ticketStore.read(fixedTicket);
    expect(stored).toMatchObject({
      status: 'found',
      record: {
        actorId: 'user-1',
        repoId: 'ler_sales',
        baseHeadCommitId: 'commit-1',
        compilerBuildId: LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId,
        runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
      },
    });
    expect(JSON.stringify(stored)).not.toMatch(/server compiled code|sourceMap|content/u);
  });

  it('does not issue tickets for partial/rejected previews, targeted previews, missing actors, or stale Heads', async () => {
    const fake = createFakeDatabase();
    const ticketCache = new FakeTicketCache();
    const ticketStore = new LightExtensionPreviewTicketStore(ticketCache, { tokenFactory: () => fixedTicket });
    const auditService = new LightExtensionAuditService(fake.db);
    vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const fileService = createFileServiceStub();
    const compileEntry = vi.fn().mockResolvedValue({
      accepted: false,
      diagnostics: [{ code: 'compile_failed', severity: 'error', message: 'failed' }],
      failureCode: 'compile_failed',
      artifact: createArtifact(),
    });
    const service = new LightExtensionCompilePreviewService(
      fake.db,
      auditService,
      fileService,
      new LightExtensionPermissionService(auditService),
      {
        compileEntry,
        getCompilerBuildIdentity: () => LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
      } as unknown as LightExtensionWorkspaceCompilerBridge,
      undefined,
      undefined,
      {
        canonicalWorkspaceBuilder: new LightExtensionCanonicalWorkspaceBuilder(fake.db),
        previewTicketStore: ticketStore,
        trustedCompileCache: new LightExtensionTrustedCompileCacheService(fake.db),
      },
    );

    const rejected = await service.compileWorkspacePreview(createWorkspacePreviewInput(), { actorUserId: 'user-1' });
    expect(rejected).toMatchObject({ accepted: false, httpStatus: 422 });
    expect(rejected.ticket).toBeUndefined();
    expect(ticketCache.values).toHaveLength(0);

    await expect(
      service.compileWorkspacePreview(
        { ...createWorkspacePreviewInput(), kind: 'js-block', entryPath: 'src/client/js-blocks/sales/index.tsx' },
        { actorUserId: 'user-1' },
      ),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_INVALID_INPUT' });
    await expect(service.compileWorkspacePreview(createWorkspacePreviewInput())).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
    });
    await expect(
      service.compileWorkspacePreview(
        { ...createWorkspacePreviewInput(), expectedHeadCommitId: 'stale' },
        { actorUserId: 'user-1' },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
      details: {
        expectedHeadCommitId: 'stale',
        currentHeadCommitId: 'commit-1',
      },
    });
  });

  it('keeps legacy Preview compatible and never signs a ticket unless issueSaveTicket is explicit', async () => {
    const fake = createFakeDatabase();
    const auditService = new LightExtensionAuditService(fake.db);
    vi.spyOn(auditService, 'recordCompileEvent').mockResolvedValue(undefined);
    const fileService = createFileServiceStub();
    const service = new LightExtensionCompilePreviewService(
      fake.db,
      auditService,
      fileService,
      new LightExtensionPermissionService(auditService),
      {
        compileEntry: vi.fn().mockResolvedValue({
          accepted: true,
          diagnostics: [],
          artifact: createArtifact(),
        }),
      } as unknown as LightExtensionWorkspaceCompilerBridge,
    );
    const input = createWorkspacePreviewInput();
    delete input.issueSaveTicket;
    delete input.expectedHeadCommitId;

    const result = await service.compileWorkspacePreview(input);

    expect(result.accepted).toBe(true);
    expect(result.ticket).toBeUndefined();
    expect(fileService.pull).not.toHaveBeenCalled();
  });

  it('normalizes trusted Preview and Save ticket fields without changing root business payloads', async () => {
    const compileWorkspacePreview = vi.fn().mockResolvedValue({ accepted: true, httpStatus: 200, diagnostics: [] });
    const previewResource = createLightExtensionsResource({
      compileWorkspacePreview,
    } as unknown as LightExtensionCompilePreviewService);
    const previewContext = {
      action: {
        params: {
          values: {
            repoId: 'ler_sales',
            expectedHeadCommitId: 'commit-1',
            issueSaveTicket: true,
            files: [{ path: 'src/client/js-blocks/sales/index.tsx', content: 'ctx.render(null);' }],
          },
        },
      },
      auth: { user: { id: 7 } },
    } as unknown as Context;
    await previewResource.actions?.compileWorkspacePreview?.(previewContext, async () => {});
    expect(compileWorkspacePreview).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_sales',
        expectedHeadCommitId: 'commit-1',
        issueSaveTicket: true,
      }),
      expect.objectContaining({ actorUserId: '7' }),
    );

    const saveSource = vi.fn().mockResolvedValue({ ok: true });
    const saveResource = createLightExtensionFilesResource(
      {} as LightExtensionFileService,
      { saveSource } as unknown as LightExtensionRuntimeCompileService,
    );
    const saveContext = {
      action: {
        params: {
          values: {
            repoId: 'ler_sales',
            expectedHeadCommitId: 'commit-1',
            message: 'Save trusted preview',
            previewTicket: fixedTicket,
            requirePreviewTicket: true,
            files: [],
          },
        },
      },
    } as unknown as Context;
    await saveResource.actions?.saveSource?.(saveContext, async () => {});
    expect(saveSource).toHaveBeenCalledWith(
      expect.objectContaining({
        previewTicket: fixedTicket,
        requirePreviewTicket: true,
      }),
      expect.any(Object),
    );
  });

  it('documents the trusted ticket request, response, fallback, and required-mode 409 contract', () => {
    const preview = swaggerDocument.paths['/lightExtensions:compileWorkspacePreview'].post;
    const previewRequest = preview.requestBody.content['application/json'].schema;
    const previewResult = swaggerDocument.components.schemas.LightExtensionWorkspacePreviewResult;
    const save = swaggerDocument.paths['/lightExtensionFiles:saveSource'].post;
    const saveRequest = save.requestBody.content['application/json'].schema;

    expect(previewRequest.required).toEqual(['repoId', 'files']);
    expect(previewRequest.properties.expectedHeadCommitId).toMatchObject({
      $ref: '#/components/schemas/LightExtensionExpectedHeadCommitId',
    });
    expect(previewRequest.properties.issueSaveTicket).toMatchObject({ type: 'boolean', default: false });
    expect(previewResult.properties.ticket).toEqual({
      $ref: '#/components/schemas/TrustedPreviewTicketSummary',
    });
    expect(saveRequest.properties.previewTicket).toMatchObject({ type: 'string' });
    expect(saveRequest.properties.requirePreviewTicket).toMatchObject({ type: 'boolean', default: false });
    expect(save.description).toContain('safely fall back');
    expect(save.responses[409].description).toContain('LIGHT_EXTENSION_PREVIEW_TICKET_INVALID');
  });
});

function createWorkspacePreviewInput(): LightExtensionWorkspacePreviewInput {
  return {
    repoId: 'ler_sales',
    expectedHeadCommitId: 'commit-1',
    issueSaveTicket: true,
    runtimeVersion: 'v2',
    files: [
      {
        path: 'src/client/js-blocks/sales/index.tsx',
        content: 'ctx.render(<div>Sales</div>);\n',
      },
      {
        path: 'src/client/js-blocks/sales/entry.json',
        content: '{"schemaVersion":1,"key":"sales"}\n',
      },
    ],
  };
}

function createFileServiceStub() {
  return {
    pull: vi.fn().mockResolvedValue({
      repo: {
        id: 'ler_sales',
        name: 'Sales',
        normalizedName: 'sales',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: 'commit-1',
      },
      commit: { id: 'commit-1' },
      tree: { hash: 'base-tree', entryCount: 2, byteSize: 10 },
      unchanged: false,
      files: [],
    }),
  } as unknown as LightExtensionFileService & { pull: ReturnType<typeof vi.fn> };
}

function createCompileInput() {
  const result = buildLightExtensionCompileKey({
    entry: {
      target: 'client',
      kind: 'js-block',
      entryPath: 'src/client/js-blocks/sales/index.tsx',
      descriptorPath: 'src/client/js-blocks/sales/entry.json',
    },
    files: [
      {
        path: 'src/client/js-blocks/sales/index.tsx',
        blobHash: 'a'.repeat(64),
        language: 'typescript',
        mode: '100644',
      },
    ],
    runtimeVersion: 'v2',
  });
  return result;
}

function createArtifact(): RunJSRuntimeArtifact {
  return {
    code: 'server compiled code',
    sourceMap: '{"version":3}',
    version: 'v2',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    filesHash: 'compiler-files-hash',
  };
}

function createExpectedEntry() {
  const compileInput = createCompileInput();
  return {
    target: 'client' as const,
    kind: 'js-block' as const,
    entryName: 'sales',
    entryId: 'entry-sales',
    entryPath: compileInput.inputManifest.entryPath,
    compileKey: compileInput.compileKey,
    filesHash: compileInput.filesHash,
    inputManifest: compileInput.inputManifest,
  };
}

function createTicketIssueInput(
  patch: Partial<TrustedPreviewTicketIssueInput['entries'][number]> = {},
): TrustedPreviewTicketIssueInput {
  const expected = createExpectedEntry();
  return {
    repoId: 'ler_sales',
    baseHeadCommitId: 'commit-1',
    actorId: 'user-1',
    workspaceDigest: 'tree-1',
    candidateTreeHash: 'tree-1',
    compilerBuildId: expected.inputManifest.compilerBuildId,
    runtimeContract: expected.inputManifest.runtimeContract,
    compilePlan: {
      changedFileCount: 1,
      affectedEntryCount: 1,
      compileCandidates: [{ target: 'client', kind: 'js-block', entryName: 'sales' }],
      metadataOnlyEntries: [],
      removedEntries: [],
    },
    entries: [
      {
        target: expected.target,
        kind: expected.kind,
        entryName: expected.entryName,
        entryId: expected.entryId,
        entryPath: expected.entryPath,
        compileKey: expected.compileKey,
        filesHash: expected.filesHash,
        artifactHash: 'artifact-placeholder',
        artifactFilesHash: 'compiler-files-hash',
        runtimeVersion: expected.inputManifest.runtimeVersion,
        ...patch,
      },
    ],
    diagnostics: [{ code: 'preview_warning', severity: 'warning' }],
  };
}

function createVerifyInput(): LightExtensionPreviewTicketVerifyInput {
  const expected = createExpectedEntry();
  return {
    previewTicket: fixedTicket,
    repoId: 'ler_sales',
    actorId: 'user-1',
    baseHeadCommitId: 'commit-1',
    workspaceDigest: 'tree-1',
    compilerBuildId: expected.inputManifest.compilerBuildId,
    runtimeContract: expected.inputManifest.runtimeContract,
    entries: [expected],
  };
}

async function createVerifierFixture() {
  const fake = createFakeDatabase();
  const compileCache = new LightExtensionTrustedCompileCacheService(fake.db);
  const compileInput = createCompileInput();
  const persisted = await compileCache.persistAcceptedCompile({
    ...compileInput,
    artifact: createArtifact(),
    diagnostics: [],
  });
  const artifactRow = { ...fake.runtimeArtifacts.rows[0] };
  const store = new LightExtensionPreviewTicketStore(new FakeTicketCache(), { tokenFactory: () => fixedTicket });
  await store.issue(createTicketIssueInput({ artifactHash: persisted.artifactHash }));
  return {
    fake,
    artifactRow,
    verifier: new LightExtensionPreviewTicketVerifier(store, compileCache),
  };
}

class FakeTicketCache {
  readonly values = new Map<string, unknown>();

  lastKey?: string;

  lastValue?: unknown;

  lastTtl?: number;

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    this.lastKey = key;
    this.lastValue = value;
    this.lastTtl = ttl;
    this.values.set(key, value);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }

  async del(key: string): Promise<void> {
    this.values.delete(key);
  }
}

class FakeRepository {
  readonly rows: Record<string, unknown>[];

  constructor(
    private readonly primaryKey: string,
    initialRows: Record<string, unknown>[] = [],
  ) {
    this.rows = initialRows;
  }

  async findOne(options: { filterByTk?: string }): Promise<Model | null> {
    const row = this.rows.find((item) => item[this.primaryKey] === options.filterByTk);
    return row ? toModel(row) : null;
  }

  async find(options: { filter?: Record<string, { $in?: string[] }> } = {}): Promise<Model[]> {
    const [field, condition] = Object.entries(options.filter || {})[0] || [];
    const rows =
      field && condition?.$in ? this.rows.filter((row) => condition.$in?.includes(String(row[field]))) : this.rows;
    return rows.map(toModel);
  }

  async updateOrCreate(options: { values: Record<string, unknown> }): Promise<Model> {
    const key = options.values[this.primaryKey];
    const existing = this.rows.find((row) => row[this.primaryKey] === key);
    if (existing) {
      Object.assign(existing, options.values);
      return toModel(existing);
    }
    const row = { ...options.values };
    this.rows.push(row);
    return toModel(row);
  }
}

function createFakeDatabase() {
  const entries = new FakeRepository('id');
  const compileCache = new FakeRepository('compileKey');
  const runtimeArtifacts = new FakeRepository('artifactHash');
  const repositories = new Map<string, FakeRepository>([
    ['lightExtensionEntries', entries],
    ['lightExtensionCompileCache', compileCache],
    ['lightExtensionRuntimeArtifacts', runtimeArtifacts],
  ]);
  const db = {
    getRepository(name: string) {
      const repository = repositories.get(name);
      if (!repository) {
        throw new Error(`Unexpected repository ${name}`);
      }
      return repository;
    },
  } as unknown as Database;
  return { db, entries, compileCache, runtimeArtifacts };
}

function toModel(row: Record<string, unknown>): Model {
  return {
    get(key: string) {
      return row[key];
    },
  } as unknown as Model;
}
