/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { parseRunJSLineMapV1 } from '@nocobase/runjs/compiler/line-map';
import {
  resolveRunJSSourceBinding,
  resolveRuntimeRunJS,
  RunJSSourceResolverError,
  RunJSSourceResolverRegistry,
  type RunJSSourceResolverResult,
} from '../index';
import { evaluateResolvedRunJSValue, getRunJSModelUse } from '../runJSRuntime';

const LIGHT_EXTENSION_SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_sales',
  entryId: 'entry_sales_kpi',
  kind: 'js-block',
};

describe('resolveRuntimeRunJS', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('resolves inline RunJS without a registered resolver', async () => {
    await expect(
      resolveRuntimeRunJS({
        runJs: {
          code: 'return 1;',
          version: 'v2',
        },
        settings: {
          region: 'APAC',
        },
      }),
    ).resolves.toEqual({
      code: 'return 1;',
      version: 'v2',
      sourceMode: 'inline',
      settings: {
        region: 'APAC',
      },
      context: undefined,
    });
  });

  it.each([
    { code: 'return 1;', expectedVersion: 'v1' },
    { code: '', expectedVersion: 'v2' },
  ])('uses $expectedVersion for inline code without a stored version', async ({ code, expectedVersion }) => {
    await expect(resolveRuntimeRunJS({ runJs: { code } })).resolves.toMatchObject({
      code,
      version: expectedVersion,
      sourceMode: 'inline',
    });
  });

  it('treats a missing sourceMode as inline even when additive source fields are present', async () => {
    const resolve = vi.fn(() => ({
      code: 'return "compiled";',
      version: 'v2',
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });

    await expect(
      resolveRuntimeRunJS({
        runJs: {
          code: 'return "legacy inline";',
          version: 'v1',
          sourceRef: { type: 'vsc-file', path: 'legacy/runjs.ts' },
          sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
          settings: { region: 'APAC' },
        },
      }),
    ).resolves.toEqual({
      code: 'return "legacy inline";',
      version: 'v1',
      sourceMode: 'inline',
      settings: { region: 'APAC' },
      context: undefined,
    });
    expect(resolve).not.toHaveBeenCalled();
  });

  it('evaluates resolved code through FlowContext.runjs with browser globals', async () => {
    const engine = new FlowEngine();

    await expect(
      evaluateResolvedRunJSValue({
        ctx: engine.context,
        resolved: {
          code: `
return {
  region: ctx.settings.region,
  sourceMode: ctx.runJsSource.sourceMode,
  windowType: typeof window,
  documentType: typeof document,
  navigatorType: typeof navigator,
  sharesDocument: window.document === document,
};
          `,
          version: 'v2',
          sourceMode: 'inline',
          settings: {
            region: 'APAC',
          },
        },
      }),
    ).resolves.toEqual({
      region: 'APAC',
      sourceMode: 'inline',
      windowType: 'object',
      documentType: 'object',
      navigatorType: 'object',
      sharesDocument: true,
    });
  });

  it('resolves the model use consistently across runtime model shapes', () => {
    expect(getRunJSModelUse({ use: 'DirectModel' })).toBe('DirectModel');
    expect(getRunJSModelUse({ _options: { use: 'PrivateOptionsModel' } })).toBe('PrivateOptionsModel');
    expect(getRunJSModelUse({ options: { use: 'OptionsModel' } })).toBe('OptionsModel');
    expect(getRunJSModelUse({ createModelOptions: { use: 'CreateOptionsModel' } })).toBe('CreateOptionsModel');
    expect(getRunJSModelUse(new (class RuntimeModel {})())).toBe('RuntimeModel');
  });

  it('resolves external source bindings through the registry', async () => {
    const sourceMap = JSON.stringify({
      version: 1,
      kind: 'runjs-line-map',
      sourceURL: 'nocobase-runjs://bundle/sales-kpi.js',
      entryPath: 'src/client/index.tsx',
      generatedCodeLineOffset: 2,
      mappings: [{ generatedLine: 3, source: 'src/client/index.tsx', sourceLine: 1, sourceColumn: 1 }],
    });
    const resolve = vi.fn(() => ({
      code: 'ctx.render("sales");',
      version: 'v2',
      sourceMap,
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });

    const settings = {
      region: 'APAC',
    };
    await expect(
      resolveRuntimeRunJS({
        sourceMode: 'light-extension',
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        settings,
      }),
    ).resolves.toMatchObject({
      code: 'ctx.render("sales");',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      sourceMap,
      settings,
    });
    expect(parseRunJSLineMapV1(sourceMap)).toMatchObject({
      sourceURL: 'nocobase-runjs://bundle/sales-kpi.js',
      entryPath: 'src/client/index.tsx',
    });
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        settings,
      }),
    );
  });

  it('resolves source fields stored inside a RunJSValue', async () => {
    const resolve = vi.fn(() => ({
      code: 'return ctx.settings.currency;',
      version: 'v2',
      settings: {
        currency: 'USD',
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });

    await expect(
      resolveRuntimeRunJS({
        runJs: {
          code: 'return "inline";',
          version: 'v1',
          sourceMode: 'light-extension',
          sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
          settings: {
            currency: 'CNY',
          },
        },
      }),
    ).resolves.toMatchObject({
      code: 'return ctx.settings.currency;',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      settings: {
        currency: 'USD',
      },
    });
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        settings: {
          currency: 'CNY',
        },
      }),
    );
  });

  it('executes the compiled artifact while leaving the inline fallback untouched', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: () => ({
        code: 'return "compiled artifact";',
        version: 'v2',
      }),
    });
    const runJs = {
      code: 'return "inline fallback";',
      version: 'v1',
      sourceRef: { type: 'vsc-file', path: 'legacy/runjs.ts' },
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
    };

    await expect(resolveRuntimeRunJS({ runJs })).resolves.toMatchObject({
      code: 'return "compiled artifact";',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
    });
    expect(runJs).toEqual({
      code: 'return "inline fallback";',
      version: 'v1',
      sourceRef: { type: 'vsc-file', path: 'legacy/runjs.ts' },
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
    });
  });

  it('lets resolver-returned settings override input settings intentionally', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'custom-source',
      resolve: () => ({
        code: 'return ctx.settings;',
        settings: {
          normalized: true,
        },
      }),
    });

    await expect(
      resolveRunJSSourceBinding({
        sourceMode: 'custom-source',
        sourceBinding: {
          id: 'source_1',
        },
        settings: {
          normalized: false,
        },
      }),
    ).resolves.toMatchObject({
      code: 'return ctx.settings;',
      version: 'v2',
      settings: {
        normalized: true,
      },
    });
  });

  it('rejects external source bindings without a sourceBinding object', async () => {
    await expect(
      resolveRunJSSourceBinding({
        sourceMode: 'light-extension',
        sourceBinding: null,
      }),
    ).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_BINDING_REQUIRED',
      sourceMode: 'light-extension',
    } satisfies Partial<RunJSSourceResolverError>);
  });

  it('rejects resolver results without string code', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'custom-source',
      resolve: () =>
        ({
          code: 1,
        }) as unknown as RunJSSourceResolverResult,
    });

    await expect(
      resolveRuntimeRunJS({
        sourceMode: 'custom-source',
        sourceBinding: {
          id: 'source_1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_CODE_REQUIRED',
      sourceMode: 'custom-source',
    } satisfies Partial<RunJSSourceResolverError>);
  });

  it('throws a standard error when external sourceMode has no resolver', async () => {
    await expect(
      resolveRuntimeRunJS({
        sourceMode: 'light-extension',
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      }),
    ).rejects.toMatchObject({
      name: 'RunJSSourceResolverError',
      code: 'RUNJS_SOURCE_RESOLVER_NOT_FOUND',
      sourceMode: 'light-extension',
    } satisfies Partial<RunJSSourceResolverError>);
  });

  it('uses the retained artifact when an external resolver is not registered', async () => {
    await expect(
      resolveRuntimeRunJS({
        runJs: {
          code: 'return "last known good";',
          sourceMode: 'light-extension',
          sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
          settings: { region: 'APAC' },
        },
      }),
    ).resolves.toEqual({
      code: 'return "last known good";',
      version: 'v1',
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      settings: { region: 'APAC' },
      context: undefined,
    });
  });

  it.each([
    Object.assign(new Error('runtime unavailable'), { code: 'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', status: 409 }),
    Object.assign(new Error('resource unavailable'), { response: { status: 404 } }),
    Object.assign(new Error('service unavailable'), { response: { status: 503 } }),
  ])('uses the retained artifact for an explicitly unavailable resolver service', async (resolverError) => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw resolverError;
      },
    });

    await expect(
      resolveRuntimeRunJS({
        runJs: {
          code: 'return "last known good";',
          version: 'v2',
          sourceMode: 'light-extension',
          sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        },
      }),
    ).resolves.toMatchObject({
      code: 'return "last known good";',
      version: 'v2',
      sourceMode: 'light-extension',
    });
  });

  it.each([
    Object.assign(new Error('permission denied'), { code: 'LIGHT_EXTENSION_PERMISSION_DENIED', status: 403 }),
    Object.assign(new Error('settings invalid'), { code: 'LIGHT_EXTENSION_SETTINGS_INVALID', status: 422 }),
    Object.assign(new Error('validation failed'), { code: 'LIGHT_EXTENSION_VALIDATION_FAILED', status: 503 }),
    Object.assign(new Error('binding conflict'), { code: 'LIGHT_EXTENSION_BINDING_OUTDATED', status: 409 }),
  ])('preserves permission and data errors instead of using the retained artifact', async (resolverError) => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw resolverError;
      },
    });

    await expect(
      resolveRuntimeRunJS({
        runJs: {
          code: 'return "last known good";',
          version: 'v2',
          sourceMode: 'light-extension',
          sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        },
      }),
    ).rejects.toBe(resolverError);
  });
});
