/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type LightExtensionEntryRecord } from '../../shared/types';
import { createCompileJob } from './helpers/compilerTestHarness';
import {
  aggregateLightExtensionCompileResults,
  assertStructuredClonePlainData,
  buildLightExtensionCompilerBuildIdentity,
  compileLightExtensionValidatedEntry,
  createLightExtensionCompileInfrastructureFailure,
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
  type LightExtensionCompilerBuildIdentityComponents,
  validateLightExtensionWorkspace,
} from '../services/LightExtensionCompileContract';
import {
  buildLightExtensionCompileKey,
  type CompileInputManifestSourceFile,
} from '../services/LightExtensionCompileKey';
import { buildLightExtensionSettingsHashes } from '../services/LightExtensionEntryService';
import {
  assertPreparedCandidateWorkspace,
  createPreparedCandidateWorkspace,
} from '../services/PreparedCandidateWorkspace';
import { type Transaction } from '@nocobase/database';
import { RUNJS_COMPILER_BUILD_IDENTITY } from '@nocobase/runjs/compiler';
import { createHash } from 'crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { vi } from 'vitest';

// Consolidated from compile-contract.test.ts.
function registerCompileContractTests() {
  describe('LightExtensionCompileContract', () => {
    it('publishes only the five retained authoring surfaces while preserving the shared RunJS compiler identity', () => {
      expect(LIGHT_EXTENSION_AUTHORING_SURFACES).toEqual({
        'js-block': {
          kind: 'js-block',
          surfaceStyle: 'render',
          compilerSurfaceStyle: 'render',
          modelUse: 'JSBlockModel',
          surface: 'js-model.render',
        },
        'js-page': {
          kind: 'js-page',
          surfaceStyle: 'render',
          compilerSurfaceStyle: 'render',
          modelUse: 'JSPageModel',
          surface: 'js-model.render',
        },
        'js-field': {
          kind: 'js-field',
          surfaceStyle: 'render',
          compilerSurfaceStyle: 'render',
          modelUse: 'JSEditableFieldModel',
          surface: 'js-model.render',
        },
        'js-action': {
          kind: 'js-action',
          surfaceStyle: 'action',
          compilerSurfaceStyle: 'action',
          modelUse: 'JSActionModel',
          surface: 'js-model.action',
        },
        'js-item': {
          kind: 'js-item',
          surfaceStyle: 'render',
          compilerSurfaceStyle: 'render',
          modelUse: 'JSItemActionModel',
          surface: 'js-model.render',
        },
      });
      expect(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.runjs).toEqual(RUNJS_COMPILER_BUILD_IDENTITY);
      expect(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.components.runjsCompilerBuildId).toBe(
        RUNJS_COMPILER_BUILD_IDENTITY.compilerBuildId,
      );
    });

    it('freezes the compiler identity before SES lockdown changes the runtime type-library fingerprint', () => {
      const contractPath = path.resolve(__dirname, '../services/LightExtensionCompileContract.ts');
      const sesPath = path.resolve(__dirname, '../../../../../../core/utils/src/ses.ts');
      const baseline = readCompilerBuildId(
        `const contract = require(${JSON.stringify(
          contractPath,
        )}); console.log(contract.LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId);`,
      );
      const afterLockdown = readCompilerBuildId(
        `const contract = require(${JSON.stringify(contractPath)}); const { lockdownSes } = require(${JSON.stringify(
          sesPath,
        )}); lockdownSes({ consoleTaming: 'unsafe', errorTaming: 'unsafe', overrideTaming: 'moderate', stackFiltering: 'verbose' }); console.log(contract.LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId);`,
      );

      expect(afterLockdown).toBe(baseline);
    });

    it('keeps workspace compilation available after SES lockdown', () => {
      const contractPath = path.resolve(__dirname, '../services/LightExtensionCompileContract.ts');
      const sesPath = path.resolve(__dirname, '../../../../../../core/utils/src/ses.ts');
      const diagnostics = JSON.parse(
        readCompilerBuildId(
          `require(${JSON.stringify(contractPath)}); const { lockdownSes } = require(${JSON.stringify(
            sesPath,
          )}); lockdownSes({ consoleTaming: 'unsafe', errorTaming: 'unsafe', overrideTaming: 'moderate', stackFiltering: 'verbose' }); require('@nocobase/runjs/compiler').compileRunJSSourceWorkspace({ files: [{ path: 'src/client/index.tsx', content: 'ctx.render(<div />);' }], entry: 'src/client/index.tsx', surfaceStyle: 'render' }).then((result) => process.stdout.write(JSON.stringify(result.artifact.diagnostics)));`,
        ),
      );

      expect(diagnostics).toEqual([]);
    });

    it('orders a complete batch by ordinal and rejects process-local values', () => {
      const jobs = [createCompileJob(0), createCompileJob(1), createCompileJob(2)];
      const results = [jobs[2], jobs[0], jobs[1]].map((job) =>
        createLightExtensionCompileInfrastructureFailure({
          job,
          workerId: 1,
          threadId: 10,
          attempt: 1,
          queueDurationMs: 0,
          runDurationMs: 1,
          failureCode: `failure_${job.ordinal}`,
          message: `failed ${job.ordinal}`,
        }),
      );

      const aggregate = aggregateLightExtensionCompileResults(jobs, results);

      expect(aggregate.accepted).toBe(false);
      expect(aggregate.results.map((result) => result.ordinal)).toEqual([0, 1, 2]);
      expect(aggregate.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
        'failed 0',
        'failed 1',
        'failed 2',
      ]);
      expect(() => assertStructuredClonePlainData({ transaction: new Map() })).toThrow(
        'Value.transaction must not contain class instances or process-local objects',
      );
    });

    it('validates a cloned workspace input without exposing a publish-capable object', () => {
      const files = [{ path: 'src/client/js-blocks/example/index.tsx', content: 'ctx.render(<div />);' }];
      const validation = {
        accepted: true,
        diagnostics: [],
        entries: [],
        capabilities: {} as never,
      };
      const validateWorkspace = vi.fn().mockReturnValue(validation);

      const result = validateLightExtensionWorkspace({ validateWorkspace }, files);

      expect(result).toBe(validation);
      expect(validateWorkspace).toHaveBeenCalledWith({ files: [{ ...files[0] }] });
      expect(validateWorkspace.mock.calls[0][0].files).not.toBe(files);
      expect(validateWorkspace.mock.calls[0][0].files[0]).not.toBe(files[0]);
      expect(result).not.toHaveProperty('candidate');
      expect(result).not.toHaveProperty('workspace');
    });

    it('compiles only validated entry and shared files through the pure compile helper', async () => {
      const compileEntry = vi.fn().mockResolvedValue({ accepted: true, diagnostics: [] });
      const files = [
        { path: 'src/client/js-blocks/example/index.tsx', content: 'ctx.render(<div />);' },
        { path: 'src/client/js-blocks/example/entry.json', content: '{"schemaVersion":1,"key":"example"}' },
        { path: 'src/shared/format.ts', content: 'export const format = String;' },
        { path: 'README.md', content: '# ignored' },
      ];

      await compileLightExtensionValidatedEntry(
        { compileEntry },
        {
          repoId: 'repo_example',
          entryId: 'entry_example',
          operation: 'compilePreview',
          entry: {
            kind: 'js-block',
            entryName: 'example',
            entryPath: 'src/client/js-blocks/example/index.tsx',
            descriptorPath: 'src/client/js-blocks/example/entry.json',
          },
          runtimeVersion: 'v2',
          files,
        },
        { requestId: 'request_example' },
      );

      expect(compileEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_example',
          entryId: 'entry_example',
          operation: 'compilePreview',
          files: [files[0], files[2]],
        }),
        { requestId: 'request_example' },
      );
      expect(compileEntry.mock.calls[0][0].files[0]).not.toBe(files[0]);
    });
  });

  function readCompilerBuildId(script: string): string {
    return execFileSync(process.execPath, ['--require', 'tsx/cjs', '--eval', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();
  }
}
registerCompileContractTests();

// Consolidated from compile-key.test.ts.
function registerCompileKeyTests() {
  describe('light extension compiler identity and compile key', () => {
    it('changes the compiler build id when a build component changes', () => {
      expect(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId).toMatch(/^[a-f0-9]{64}$/u);
      for (const component of Object.keys(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS) as Array<
        keyof LightExtensionCompilerBuildIdentityComponents
      >) {
        const current = LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS[component];
        const changed = {
          ...LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
          [component]: typeof current === 'number' ? current + 1 : `${current}.changed`,
        } as LightExtensionCompilerBuildIdentityComponents;
        expect(buildLightExtensionCompilerBuildIdentity(changed).compilerBuildId, component).not.toBe(
          LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId,
        );
      }
    });

    it('builds a canonical key from blob metadata without source contents', () => {
      const entry = createEntry();
      const files = compileFiles();
      const first = buildLightExtensionCompileKey({ entry, files });
      const reordered = buildLightExtensionCompileKey({ entry, files: [...files].reverse() });

      expect(reordered).toEqual(first);
      expect(first.compileKey).toMatch(/^[a-f0-9]{64}$/u);
      expect(first.inputManifest.files).toEqual([
        expect.objectContaining({ path: 'src/client/js-blocks/sales/index.tsx', blobHash: 'blob_entry' }),
        expect.objectContaining({ path: 'src/shared/format.ts', blobHash: 'blob_shared' }),
      ]);
      expect(first.inputManifest.files).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ path: entry.descriptorPath })]),
      );
      expect(JSON.stringify(first.inputManifest)).not.toContain('source body');
    });

    it('changes for blob, entry path, and compiler contract changes but ignores repository metadata', () => {
      const entry = createEntry();
      const files = compileFiles();
      const first = buildLightExtensionCompileKey({ entry, files });
      const changedBlob = buildLightExtensionCompileKey({
        entry,
        files: files.map((file) =>
          file.path.endsWith('/index.tsx') ? { ...file, blobHash: 'blob_entry_changed' } : file,
        ),
      });
      const moved = buildLightExtensionCompileKey({
        entry: {
          ...entry,
          entryPath: 'src/client/js-blocks/moved/index.tsx',
          descriptorPath: 'src/client/js-blocks/moved/entry.json',
        },
        files: files.map((file) => ({ ...file, path: file.path.replace('/sales/', '/moved/') })),
      });
      const changedBuild = buildLightExtensionCompileKey({
        entry,
        files,
        compilerBuildIdentity: buildLightExtensionCompilerBuildIdentity({
          ...LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
          validatorVersion: 'changed-validator',
        }),
      });
      const changedDisplayMetadata = buildLightExtensionCompileKey({
        entry: { ...entry, repoId: 'repo_other', title: 'Changed title' },
        files,
      });

      expect(changedBlob.compileKey).not.toBe(first.compileKey);
      expect(moved.compileKey).not.toBe(first.compileKey);
      expect(changedBuild.compileKey).not.toBe(first.compileKey);
      expect(changedDisplayMetadata.compileKey).toBe(first.compileKey);
    });
  });

  describe('settings hash identity', () => {
    it('preserves explicit root null and array defaults in the defaults hash', () => {
      expect(buildLightExtensionSettingsHashes({ type: ['object', 'null'], default: null }).settingsDefaultsHash).toBe(
        createHash('sha256').update('null').digest('hex'),
      );
      expect(buildLightExtensionSettingsHashes({ type: 'array', default: [] }).settingsDefaultsHash).toBe(
        createHash('sha256').update('[]').digest('hex'),
      );
    });

    it('distinguishes missing settings schemas from explicit empty schemas', () => {
      const emptyHash = createHash('sha256').update('{}').digest('hex');

      expect(buildLightExtensionSettingsHashes(null)).toEqual({
        settingsSchemaHash: null,
        settingsDefaultsHash: null,
      });
      expect(buildLightExtensionSettingsHashes({})).toEqual({
        settingsSchemaHash: emptyHash,
        settingsDefaultsHash: emptyHash,
      });
    });
  });

  function createEntry(): LightExtensionEntryRecord {
    return {
      id: 'entry_sales',
      repoId: 'repo_sales',
      target: 'client',
      kind: 'js-block',
      entryName: 'sales',
      entryPath: 'src/client/js-blocks/sales/index.tsx',
      descriptorPath: 'src/client/js-blocks/sales/entry.json',
      title: 'Sales',
      description: null,
      category: null,
      icon: null,
      tags: null,
      sort: null,
      settingsSchema: null,
      settingsSchemaHash: null,
      compiledCommitId: null,
      compiledInputKey: null,
      compilerBuildId: null,
      runtimeArtifact: null,
      runtimeVersion: null,
      surfaceStyle: null,
      runtimeCodeHash: null,
      artifactHash: null,
      filesHash: null,
      settingsDefaultsHash: null,
      compiledAt: null,
      healthStatus: 'ready',
      diagnostics: [],
    };
  }

  function compileFiles(): CompileInputManifestSourceFile[] {
    return [
      { path: 'README.md', blobHash: 'blob_readme', language: 'markdown', mode: '100644' },
      { path: 'src/shared/format.ts', blobHash: 'blob_shared', language: 'typescript', mode: '100644' },
      {
        path: 'src/client/js-blocks/sales/entry.json',
        blobHash: 'blob_descriptor',
        language: 'json',
        mode: '100644',
      },
      {
        path: 'src/client/js-blocks/sales/index.tsx',
        blobHash: 'blob_entry',
        language: 'typescript',
        mode: '100644',
      },
    ];
  }
}
registerCompileKeyTests();

// Consolidated from prepared-candidate-workspace.test.ts.
function registerPreparedCandidateWorkspaceTests() {
  describe('PreparedCandidateWorkspace identity guard', () => {
    it('binds candidates to the creating transaction, repository, commit, and tree', () => {
      const transaction = { id: 'tx_candidate' } as unknown as Transaction;
      const candidate = createPreparedCandidateWorkspace(
        {
          repo: {
            id: 'repo_candidate',
            name: 'candidate',
            normalizedName: 'candidate',
            title: null,
            description: null,
            lifecycleStatus: 'enabled',
            healthStatus: 'ready',
            headCommitId: 'commit_candidate',
            lastCompiledAt: null,
            createdAt: null,
            updatedAt: null,
          },
          commit: {
            id: 'commit_candidate',
            repoId: 'repo_candidate',
            hash: 'commit_hash_candidate',
            parentCommitId: null,
            treeHash: 'tree_candidate',
            seq: 1,
            message: 'candidate',
            authorId: null,
            metadata: {},
          },
          tree: {
            hash: 'tree_candidate',
            entryCount: 0,
            byteSize: 0,
          },
          validation: {
            accepted: true,
            diagnostics: [],
            entries: [],
            capabilities: {} as never,
          },
          vscSnapshot: {
            baseCommitId: null,
            baseTreeHash: null,
            commitId: 'commit_candidate',
            treeHash: 'tree_candidate',
            changedPaths: [],
            changes: [],
            files: [],
          },
        },
        transaction,
      );

      expect(() =>
        assertPreparedCandidateWorkspace(candidate, {
          transaction,
          repoId: 'repo_candidate',
          commitId: 'commit_candidate',
        }),
      ).not.toThrow();
      expect(() =>
        assertPreparedCandidateWorkspace(candidate, {
          transaction: { id: 'tx_other' } as unknown as Transaction,
        }),
      ).toThrow('cannot be reused across transactions');
      expect(() => assertPreparedCandidateWorkspace(candidate, { repoId: 'repo_other' })).toThrow(
        'belongs to a different repository',
      );
      expect(() => assertPreparedCandidateWorkspace(candidate, { commitId: 'commit_other' })).toThrow(
        'belongs to a different commit',
      );
      const forgedCandidate = { ...candidate };
      expect(() => assertPreparedCandidateWorkspace(forgedCandidate, { transaction })).toThrow(
        'was not prepared by the light-extension file service',
      );
      expect(() => assertPreparedCandidateWorkspace(structuredClone(candidate), { transaction })).toThrow(
        'was not prepared by the light-extension file service',
      );
      expect(Object.keys(candidate)).not.toContain('transaction');
    });
  });
}
registerPreparedCandidateWorkspaceTests();
