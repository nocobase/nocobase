/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_SCHEMA_URI } from '@nocobase/js-template-sdk/schema';
import type { Database } from '@nocobase/database';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash } from '@nocobase/runjs/server';
import { expectTypeOf } from 'vitest';

import {
  LIGHT_EXTENSION_COLLECTIONS,
  LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT,
  LIGHT_EXTENSION_OWNER_TYPE,
  LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
  LIGHT_EXTENSION_SOURCE_BINDING_TYPE,
  LIGHT_EXTENSION_SOURCE_MODE,
} from '../../constants';
import type { LightExtensionRuntimeResolveInput, LightExtensionRuntimeSourceBinding } from '../../shared/types';
import {
  JS_TEMPLATE_AUTHORING_SURFACES,
  JS_TEMPLATE_COLLECTIONS,
  JS_TEMPLATE_COMPILER_BRIDGE_CONTRACT_VERSION,
  JS_TEMPLATE_ENTRY_DESCRIPTOR_FILE,
  JS_TEMPLATE_ENTRY_SCHEMA_URI,
  JS_TEMPLATE_ERROR_CODE_PREFIX,
  JS_TEMPLATE_IMPORT_REWRITE_POLICY_VERSION,
  JS_TEMPLATE_IMPORT_SECURITY_POLICY_VERSION,
  JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT,
  JS_TEMPLATE_RUNTIME_ARTIFACT_CONTRACT,
  JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT,
  JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT_VERSION,
  JS_TEMPLATE_SOURCE_BINDING_TYPE,
  JS_TEMPLATE_SOURCE_MODE,
  JS_TEMPLATE_VSC_OWNER_TYPE,
  JsTemplateRuntimeResolveService,
  JsTemplateValidator,
  aggregateJsTemplateCompileResults,
  assertJsTemplateCompileJob,
  buildJsTemplateCompileKey,
  createJsTemplateCompileInfrastructureFailure,
  createJsTemplateRuntimeSourceBinding,
  isJsTemplateRuntimeSourceBinding,
  normalizeJsTemplateCompileResult,
  selectJsTemplateEntryCompileFiles,
  serializeJsTemplateRunJSPersistence,
  type JsTemplateCompileJob,
  type JsTemplateRuntimeResolveInput,
  type JsTemplateRuntimeSourceBinding,
} from '../jsTemplateDomain';
import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BRIDGE_CONTRACT_VERSION,
  LIGHT_EXTENSION_IMPORT_REWRITE_POLICY_VERSION,
  LIGHT_EXTENSION_IMPORT_SECURITY_POLICY_VERSION,
  LIGHT_EXTENSION_RUNTIME_SURFACE_CONTRACT_VERSION,
  aggregateLightExtensionCompileResults,
  assertLightExtensionCompileJob,
  createLightExtensionCompileInfrastructureFailure,
  selectLightExtensionEntryCompileFiles,
} from '../services/LightExtensionCompileContract';
import { buildLightExtensionCompileKey } from '../services/LightExtensionCompileKey';
import type { LightExtensionWorkspaceCompileResult } from '../services/LightExtensionWorkspaceCompilerBridge';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import { createCompileJob } from './helpers/compilerTestHarness';

describe('JS Template RunJS persistence and runtime compatibility', () => {
  it('exports canonical names backed by the frozen legacy wire identities', () => {
    expect(JS_TEMPLATE_RUNJS_PERSISTENCE_RUNTIME_CONTRACT).toEqual({
      sourceMode: 'light-extension',
      sourceBindingType: 'light-extension-entry',
      collectionNames: [
        'lightExtensionRepos',
        'lightExtensionEntries',
        'lightExtensionReferences',
        'lightExtensionRuntimeArtifacts',
        'lightExtensionLogs',
        'lightExtensionMoveOperations',
        'lightExtensionCreateJobs',
      ],
      vscOwnerType: 'light-extension',
      runtimeArtifactContract: 'light-extension.runtime-artifact.v1',
      runtimeSurfaceContract: 'light-extension.runtime-surface.v1',
      entrySchemaUri: 'https://schemas.nocobase.com/light-extension/entry-v1.schema.json',
      entryDescriptorFile: 'entry.json',
      errorCodePrefix: 'LIGHT_EXTENSION_',
    });
    expect(JS_TEMPLATE_SOURCE_MODE).toBe(LIGHT_EXTENSION_SOURCE_MODE);
    expect(JS_TEMPLATE_SOURCE_BINDING_TYPE).toBe(LIGHT_EXTENSION_SOURCE_BINDING_TYPE);
    expect(JS_TEMPLATE_COLLECTIONS).toBe(LIGHT_EXTENSION_COLLECTIONS);
    expect(JS_TEMPLATE_VSC_OWNER_TYPE).toBe(LIGHT_EXTENSION_OWNER_TYPE);
    expect(JS_TEMPLATE_RUNTIME_ARTIFACT_CONTRACT).toBe(LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT);
    expect(JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT).toBe(LIGHT_EXTENSION_RUNTIME_SURFACE_CONTRACT_VERSION);
    expect(JS_TEMPLATE_RUNTIME_SURFACE_CONTRACT_VERSION).toBe(LIGHT_EXTENSION_RUNTIME_SURFACE_CONTRACT_VERSION);
    expect(JS_TEMPLATE_ENTRY_SCHEMA_URI).toBe(LIGHT_EXTENSION_ENTRY_SCHEMA_URI);
    expect(JS_TEMPLATE_ENTRY_DESCRIPTOR_FILE).toBe('entry.json');
    expect(JS_TEMPLATE_ERROR_CODE_PREFIX).toBe('LIGHT_EXTENSION_');
    expect(JS_TEMPLATE_AUTHORING_SURFACES).toBe(LIGHT_EXTENSION_AUTHORING_SURFACES);
    expect(JS_TEMPLATE_COMPILER_BRIDGE_CONTRACT_VERSION).toBe(LIGHT_EXTENSION_COMPILER_BRIDGE_CONTRACT_VERSION);
    expect(JS_TEMPLATE_IMPORT_REWRITE_POLICY_VERSION).toBe(LIGHT_EXTENSION_IMPORT_REWRITE_POLICY_VERSION);
    expect(JS_TEMPLATE_IMPORT_SECURITY_POLICY_VERSION).toBe(LIGHT_EXTENSION_IMPORT_SECURITY_POLICY_VERSION);
    expect(aggregateJsTemplateCompileResults).toBe(aggregateLightExtensionCompileResults);
    expect(assertJsTemplateCompileJob).toBe(assertLightExtensionCompileJob);
    expect(createJsTemplateCompileInfrastructureFailure).toBe(createLightExtensionCompileInfrastructureFailure);
    expect(selectJsTemplateEntryCompileFiles).toBe(selectLightExtensionEntryCompileFiles);
    expect(LIGHT_EXTENSION_LEGACY_PERSISTENCE_CONTRACT.sourceMode).toBe(JS_TEMPLATE_SOURCE_MODE);

    expectTypeOf<JsTemplateRuntimeSourceBinding>().toEqualTypeOf<LightExtensionRuntimeSourceBinding>();
    expectTypeOf<JsTemplateRuntimeResolveInput>().toEqualTypeOf<LightExtensionRuntimeResolveInput>();
    expectTypeOf<JsTemplateCompileJob>().toEqualTypeOf<ReturnType<typeof createCompileJob>>();
  });

  it('round-trips historical FlowModel source data without creating JS Template wire tokens', () => {
    const fixture = {
      stepParams: {
        jsSettings: {
          runJs: {
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'ler_legacy_sales',
              repoName: 'legacy-sales',
              repoTitle: 'Legacy Sales',
              entryId: 'lee_legacy_sales',
              entryTitle: 'Legacy Sales KPI',
              entryName: 'sales-kpi',
              entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
              kind: 'js-block',
            },
            settings: { region: 'APAC' },
          },
        },
      },
    };
    const loaded = JSON.parse(JSON.stringify(fixture)) as typeof fixture;
    const loadedRunJs = loaded.stepParams.jsSettings.runJs;

    expect(isJsTemplateRuntimeSourceBinding(loadedRunJs.sourceBinding)).toBe(true);
    const persisted = serializeJsTemplateRunJSPersistence(loadedRunJs.sourceBinding);
    loadedRunJs.sourceMode = persisted.sourceMode;
    loadedRunJs.sourceBinding = persisted.sourceBinding;

    expect(loaded).toEqual(fixture);
    expect(JSON.stringify(loaded)).not.toContain('js-template-entry');
    expect(JSON.stringify(loaded)).not.toContain('"sourceMode":"js-template"');
    expect(createJsTemplateRuntimeSourceBinding({ repoId: 'ler_1', entryId: 'lee_1', kind: 'js-page' })).toEqual({
      type: 'light-extension-entry',
      repoId: 'ler_1',
      entryId: 'lee_1',
      kind: 'js-page',
    });
    expect(() =>
      serializeJsTemplateRunJSPersistence({
        type: 'js-template-entry',
        repoId: 'ler_1',
        entryId: 'lee_1',
        kind: 'js-page',
      }),
    ).toThrow(/light-extension-entry/u);
  });

  it('reads historical entry descriptors through both domain names without changing the descriptor', () => {
    const descriptor = {
      $schema: 'https://schemas.nocobase.com/light-extension/entry-v1.schema.json',
      schemaVersion: 1,
      key: 'legacy-sales',
      title: 'Legacy sales',
      settings: {
        region: { type: 'string', default: 'APAC' },
      },
    };
    const content = JSON.stringify(descriptor);
    const files = [
      { path: 'src/client/js-blocks/legacy-sales/index.tsx', content: 'ctx.render(ctx.settings.region);\n' },
      { path: 'src/client/js-blocks/legacy-sales/entry.json', content },
    ];

    const canonical = new JsTemplateValidator().validateWorkspace({ files });
    const legacy = new LightExtensionValidator().validateWorkspace({ files });

    expect(canonical).toEqual(legacy);
    expect(canonical).toMatchObject({
      accepted: true,
      entries: [
        {
          entryName: 'legacy-sales',
          descriptorPath: 'src/client/js-blocks/legacy-sales/entry.json',
        },
      ],
    });
    expect(files[1].content).toBe(content);
    expect(JSON.parse(files[1].content)).toEqual(descriptor);
  });

  it('keeps compile surface and artifact hashes identical through canonical aliases', () => {
    const job = createCompileJob(0);
    const canonicalKey = buildJsTemplateCompileKey({
      entry: {
        target: 'client',
        kind: job.kind,
        entryPath: job.entryPath,
        descriptorPath: job.entryPath.replace(/index\.tsx$/u, 'entry.json'),
      },
      files: job.files,
    });
    const legacyKey = buildLightExtensionCompileKey({
      entry: {
        target: 'client',
        kind: job.kind,
        entryPath: job.entryPath,
        descriptorPath: job.entryPath.replace(/index\.tsx$/u, 'entry.json'),
      },
      files: job.files,
    });
    expect(canonicalKey).toEqual(legacyKey);
    expect(canonicalKey.inputManifest).toMatchObject({
      kind: 'js-block',
      surfaceStyle: 'render',
      compilerSurfaceStyle: 'render',
      modelUse: 'JSBlockModel',
      runtimeContract: 'light-extension.runtime-artifact.v1',
    });

    const code = 'ctx.render("runtime");';
    const sourceMap = '{"version":3}';
    const compiled = {
      accepted: true,
      artifact: {
        code,
        sourceMap,
        version: 'v2',
        entryPath: job.entryPath,
        filesHash: job.filesHash,
        diagnostics: [],
        metadata: { kind: 'js-block' },
      },
      diagnostics: [],
      surface: JS_TEMPLATE_AUTHORING_SURFACES['js-block'],
    } satisfies LightExtensionWorkspaceCompileResult;
    const normalized = normalizeJsTemplateCompileResult(job, compiled, {
      workerId: 1,
      threadId: 1,
      attempt: 1,
      queueDurationMs: 0,
      runDurationMs: 1,
    });
    const expectedArtifactHash = buildRunJSArtifactHash({
      code,
      sourceMap,
      version: 'v2',
      entryPath: job.entryPath,
      runtimeContract: 'light-extension.runtime-artifact.v1',
    });

    expect(normalized).toMatchObject({
      accepted: true,
      kind: 'js-block',
      artifactHash: expectedArtifactHash,
      runtimeCodeHash: buildRunJSRuntimeCodeHash(code),
      inputManifest: {
        runtimeContract: 'light-extension.runtime-artifact.v1',
        surfaceStyle: 'render',
        compilerSurfaceStyle: 'render',
        modelUse: 'JSBlockModel',
      },
    });
  });

  it('rejects invented JS Template wire tokens with the legacy public error code', async () => {
    const service = new JsTemplateRuntimeResolveService({} as Database);
    await expect(
      service.resolve({
        sourceMode: 'js-template',
        sourceBinding: {
          type: 'js-template-entry',
          repoId: 'ler_1',
          entryId: 'lee_1',
          kind: 'js-block',
        },
      } as never),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_INVALID_INPUT',
      status: 422,
      details: { reasonCode: 'invalid_input' },
    });
  });
});
