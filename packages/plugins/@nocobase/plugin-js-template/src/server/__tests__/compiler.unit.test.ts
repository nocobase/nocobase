/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type JsTemplate } from '../../shared/types';
import { createCompileJob } from './helpers/compilerTestHarness';
import {
  aggregateJsTemplateCompileResults,
  buildJsTemplateCompilerBuildIdentity,
  compileJsTemplateValidatedTemplate,
  createJsTemplateCompileInfrastructureFailure,
  JS_TEMPLATE_COMPILER_BUILD_IDENTITY,
  JS_TEMPLATE_COMPILER_BUILD_IDENTITY_COMPONENTS,
  JS_TEMPLATE_IMPORT_REWRITE_POLICY_VERSION,
  type JsTemplateCompilerBuildIdentityComponents,
} from '../services/JsTemplateCompileContract';
import { buildJsTemplateCompileKey, type CompileInputManifestSourceFile } from '../services/JsTemplateCompileKey';
import { buildJsTemplateSettingsHashes } from '../services/JsTemplateService';
import {
  assertPreparedCandidateWorkspace,
  createPreparedCandidateWorkspace,
} from '../services/PreparedCandidateWorkspace';
import { type Transaction } from '@nocobase/database';
import { createHash } from 'crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { vi } from 'vitest';

// Consolidated from compile-contract.test.ts.
function registerCompileContractTests() {
  describe('JsTemplateCompileContract', () => {
    it('freezes the compiler identity before SES lockdown changes the runtime type-library fingerprint', () => {
      const contractPath = path.resolve(__dirname, '../services/JsTemplateCompileContract.ts');
      const sesPath = path.resolve(__dirname, '../../../../../../core/utils/src/ses.ts');
      const baseline = readCompilerBuildId(
        `const contract = require(${JSON.stringify(
          contractPath,
        )}); console.log(contract.JS_TEMPLATE_COMPILER_BUILD_IDENTITY.compilerBuildId);`,
      );
      const afterLockdown = readCompilerBuildId(
        `const contract = require(${JSON.stringify(contractPath)}); const { lockdownSes } = require(${JSON.stringify(
          sesPath,
        )}); lockdownSes({ consoleTaming: 'unsafe', errorTaming: 'unsafe', overrideTaming: 'moderate', stackFiltering: 'verbose' }); console.log(contract.JS_TEMPLATE_COMPILER_BUILD_IDENTITY.compilerBuildId);`,
      );

      expect(afterLockdown).toBe(baseline);
    });

    it('keeps workspace compilation available after SES lockdown', () => {
      const contractPath = path.resolve(__dirname, '../services/JsTemplateCompileContract.ts');
      const compilerLoaderPath = path.resolve(__dirname, '../../../../../../core/runjs/src/compiler/loader.ts');
      const sesPath = path.resolve(__dirname, '../../../../../../core/utils/src/ses.ts');
      const diagnostics = JSON.parse(
        readCompilerBuildId(
          `require(${JSON.stringify(contractPath)}); const { loadRunJSCompiler } = require(${JSON.stringify(
            compilerLoaderPath,
          )}); const { lockdownSes } = require(${JSON.stringify(
            sesPath,
          )}); lockdownSes({ consoleTaming: 'unsafe', errorTaming: 'unsafe', overrideTaming: 'moderate', stackFiltering: 'verbose' }); loadRunJSCompiler().then(({ compileRunJSSourceWorkspace }) => compileRunJSSourceWorkspace({ files: [{ path: 'src/client/index.tsx', content: 'ctx.render(<div />);' }], entry: 'src/client/index.tsx', surfaceStyle: 'render' })).then((result) => process.stdout.write(JSON.stringify(result.artifact.diagnostics)));`,
        ),
      );

      expect(diagnostics).toEqual([]);
    });

    it('resolves workspace peer packages from source in compile subprocesses', () => {
      const databaseEntry = readCompilerBuildId(
        `require('@nocobase/runjs/workspace/server'); console.log(require.resolve('@nocobase/database'));`,
      );

      expect(databaseEntry.replace(/\\/g, '/')).toMatch(/\/packages\/core\/database\/src\/index\.ts$/u);
    });

    it('orders a complete batch by ordinal', () => {
      const jobs = [createCompileJob(0), createCompileJob(1), createCompileJob(2)];
      const results = [jobs[2], jobs[0], jobs[1]].map((job) =>
        createJsTemplateCompileInfrastructureFailure({
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

      const aggregate = aggregateJsTemplateCompileResults(jobs, results);

      expect(aggregate.accepted).toBe(false);
      expect(aggregate.results.map((result) => result.ordinal)).toEqual([0, 1, 2]);
      expect(aggregate.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
        'failed 0',
        'failed 1',
        'failed 2',
      ]);
    });

    it('compiles the validated template with shared files and every settings descriptor', async () => {
      const compileEntry = vi.fn().mockResolvedValue({ accepted: true, diagnostics: [] });
      const files = [
        { path: 'src/client/js-blocks/example/index.tsx', content: 'ctx.render(<div />);' },
        { path: 'src/client/js-blocks/example/entry.json', content: '{"schemaVersion":1,"key":"example"}' },
        {
          path: 'src/client/js-blocks/orders/entry.json',
          content: '{"schemaVersion":1,"key":"orders","settings":{"title":{"type":"string"}}}',
        },
        { path: 'src/shared/format.ts', content: 'export const format = String;' },
        { path: 'README.md', content: '# ignored' },
      ];

      await compileJsTemplateValidatedTemplate(
        { compileEntry },
        {
          projectId: 'project_example',
          templateId: 'template_example',
          operation: 'compilePreview',
          template: {
            kind: 'js-block',
            templateName: 'example',
            entryPath: 'src/client/js-blocks/example/index.tsx',
            descriptorPath: 'src/client/js-blocks/example/entry.json',
          },
          runtimeVersion: 'v2',
          files,
        },
      );

      expect(compileEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project_example',
          templateId: 'template_example',
          operation: 'compilePreview',
          files: [files[0], files[1], files[2], files[3]],
        }),
      );
      expect(compileEntry.mock.calls[0][0].files[0]).not.toBe(files[0]);
    });
  });

  function readCompilerBuildId(script: string): string {
    const runJSSourceRegisterPath = path.resolve(__dirname, '../../../../../../core/runjs/register-source.cjs');
    return execFileSync(process.execPath, ['--require', runJSSourceRegisterPath, '--import', 'tsx', '--eval', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();
  }
}
registerCompileContractTests();

// Consolidated from compile-key.test.ts.
function registerCompileKeyTests() {
  describe('JS Template compiler identity and compile key', () => {
    it('changes the compiler build id when a build component changes', () => {
      expect(JS_TEMPLATE_COMPILER_BUILD_IDENTITY.compilerBuildId).toMatch(/^[a-f0-9]{64}$/u);
      expect(JS_TEMPLATE_IMPORT_REWRITE_POLICY_VERSION).toBe('js-template.import-rewrite.v3');
      for (const component of Object.keys(JS_TEMPLATE_COMPILER_BUILD_IDENTITY_COMPONENTS) as Array<
        keyof JsTemplateCompilerBuildIdentityComponents
      >) {
        const current = JS_TEMPLATE_COMPILER_BUILD_IDENTITY_COMPONENTS[component];
        const changed = {
          ...JS_TEMPLATE_COMPILER_BUILD_IDENTITY_COMPONENTS,
          [component]: typeof current === 'number' ? current + 1 : `${current}.changed`,
        } as JsTemplateCompilerBuildIdentityComponents;
        expect(buildJsTemplateCompilerBuildIdentity(changed).compilerBuildId, component).not.toBe(
          JS_TEMPLATE_COMPILER_BUILD_IDENTITY.compilerBuildId,
        );
      }
    });

    it('builds a canonical key from blob metadata without source contents', () => {
      const template = createTemplate();
      const files = compileFiles();
      const first = buildJsTemplateCompileKey({ template, files });
      const reordered = buildJsTemplateCompileKey({ template, files: [...files].reverse() });

      expect(reordered).toEqual(first);
      expect(first.compileKey).toMatch(/^[a-f0-9]{64}$/u);
      expect(first.inputManifest.files).toEqual([
        expect.objectContaining({ path: 'src/client/js-blocks/orders/entry.json', blobHash: 'blob_orders_descriptor' }),
        expect.objectContaining({ path: template.descriptorPath, blobHash: 'blob_descriptor' }),
        expect.objectContaining({ path: 'src/client/js-blocks/sales/index.tsx', blobHash: 'blob_entry' }),
        expect.objectContaining({ path: 'src/shared/format.ts', blobHash: 'blob_shared' }),
      ]);
      expect(JSON.stringify(first.inputManifest)).not.toContain('source body');
    });

    it('changes for blob, entry path, and compiler contract changes but ignores project display metadata', () => {
      const template = createTemplate();
      const files = compileFiles();
      const first = buildJsTemplateCompileKey({ template, files });
      const changedBlob = buildJsTemplateCompileKey({
        template,
        files: files.map((file) =>
          file.path.endsWith('/index.tsx') ? { ...file, blobHash: 'blob_entry_changed' } : file,
        ),
      });
      const moved = buildJsTemplateCompileKey({
        template: {
          ...template,
          entryPath: 'src/client/js-blocks/moved/index.tsx',
          descriptorPath: 'src/client/js-blocks/moved/entry.json',
        },
        files: files.map((file) => ({ ...file, path: file.path.replace('/sales/', '/moved/') })),
      });
      const changedBuild = buildJsTemplateCompileKey({
        template,
        files,
        compilerBuildIdentity: buildJsTemplateCompilerBuildIdentity({
          ...JS_TEMPLATE_COMPILER_BUILD_IDENTITY_COMPONENTS,
          validatorVersion: 'changed-validator',
        }),
      });
      const changedDisplayMetadata = buildJsTemplateCompileKey({
        template: { ...template, projectId: 'project_other', title: 'Changed title' },
        files,
      });
      const changedReferencedSettings = buildJsTemplateCompileKey({
        template,
        files: files.map((file) =>
          file.path === 'src/client/js-blocks/orders/entry.json'
            ? { ...file, blobHash: 'blob_orders_descriptor_changed' }
            : file,
        ),
      });

      expect(changedBlob.compileKey).not.toBe(first.compileKey);
      expect(moved.compileKey).not.toBe(first.compileKey);
      expect(changedBuild.compileKey).not.toBe(first.compileKey);
      expect(changedReferencedSettings.compileKey).not.toBe(first.compileKey);
      expect(changedDisplayMetadata.compileKey).toBe(first.compileKey);
    });
  });

  describe('settings hash identity', () => {
    it('preserves explicit root null and array defaults in the defaults hash', () => {
      expect(buildJsTemplateSettingsHashes({ type: ['object', 'null'], default: null }).settingsDefaultsHash).toBe(
        createHash('sha256').update('null').digest('hex'),
      );
      expect(buildJsTemplateSettingsHashes({ type: 'array', default: [] }).settingsDefaultsHash).toBe(
        createHash('sha256').update('[]').digest('hex'),
      );
    });

    it('distinguishes missing settings schemas from explicit empty schemas', () => {
      const emptyHash = createHash('sha256').update('{}').digest('hex');

      expect(buildJsTemplateSettingsHashes(null)).toEqual({
        settingsSchemaHash: null,
        settingsDefaultsHash: null,
      });
      expect(buildJsTemplateSettingsHashes({})).toEqual({
        settingsSchemaHash: emptyHash,
        settingsDefaultsHash: emptyHash,
      });
    });
  });

  function createTemplate(): JsTemplate {
    return {
      id: 'template_sales',
      projectId: 'project_sales',
      target: 'client',
      kind: 'js-block',
      templateName: 'sales',
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
        path: 'src/client/js-blocks/orders/entry.json',
        blobHash: 'blob_orders_descriptor',
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
    it('binds candidates to the creating transaction, project, commit, and tree', () => {
      const transaction = { id: 'tx_candidate' } as unknown as Transaction;
      const candidate = createPreparedCandidateWorkspace(
        {
          project: {
            id: 'project_candidate',
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
            projectId: 'project_candidate',
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
            templates: [],
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
          projectId: 'project_candidate',
          commitId: 'commit_candidate',
        }),
      ).not.toThrow();
      expect(() =>
        assertPreparedCandidateWorkspace(candidate, {
          transaction: { id: 'tx_other' } as unknown as Transaction,
        }),
      ).toThrow('cannot be reused across transactions');
      expect(() => assertPreparedCandidateWorkspace(candidate, { projectId: 'project_other' })).toThrow(
        'belongs to a different JS Template project',
      );
      expect(() => assertPreparedCandidateWorkspace(candidate, { commitId: 'commit_other' })).toThrow(
        'belongs to a different commit',
      );
      expect(() =>
        createPreparedCandidateWorkspace(
          {
            project: candidate.project,
            commit: candidate.commit,
            tree: { ...candidate.tree, hash: 'tree_other' },
            validation: candidate.validation,
            vscSnapshot: candidate.vscSnapshot,
          },
          transaction,
        ),
      ).toThrow('identity does not match its JS Template project, commit, and tree');
      const forgedCandidate = { ...candidate };
      expect(() => assertPreparedCandidateWorkspace(forgedCandidate, { transaction })).toThrow(
        'was not prepared by the js-template file service',
      );
      expect(() => assertPreparedCandidateWorkspace(structuredClone(candidate), { transaction })).toThrow(
        'was not prepared by the js-template file service',
      );
      expect(Object.keys(candidate)).not.toContain('transaction');
    });
  });
}
registerPreparedCandidateWorkspaceTests();
