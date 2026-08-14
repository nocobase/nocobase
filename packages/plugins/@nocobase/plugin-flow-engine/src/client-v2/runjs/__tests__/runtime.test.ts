/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createRunJSRuntimeContext,
  evaluateResolvedRunJSValue,
  getRunJSModelUse,
  resolveRuntimeRunJS,
} from '../runtime';
import { readRunJSRuntimeError } from '../runtimeError';
import { RunJSSourceResolverRegistryManager } from '../runJSRegistryHost';
import { FlowEngine } from '@nocobase/flow-engine';

describe('plugin-flow-engine RunJS runtime adapter', () => {
  it('resolves legacy inline source without requiring any external resolver', async () => {
    await expect(resolveRuntimeRunJS({ runJs: { code: 'return 1;' }, settings: { enabled: true } })).resolves.toEqual({
      code: 'return 1;',
      version: 'v1',
      sourceMode: 'inline',
      settings: { enabled: true },
      context: undefined,
    });
  });

  it('resolves an external source through the plugin-owned registry while retaining a last-known-good artifact', async () => {
    const registry = new RunJSSourceResolverRegistryManager();
    registry.registerResolver({
      sourceMode: 'js-template',
      resolve: () => ({ code: 'return "compiled";', version: 'v2', settings: { compiled: true } }),
    });

    await expect(
      resolveRuntimeRunJS(
        {
          runJs: {
            code: 'return "fallback";',
            version: 'v1',
            sourceMode: 'js-template',
            sourceBinding: { templateId: 'template-1' },
          },
        },
        registry,
      ),
    ).resolves.toMatchObject({
      code: 'return "compiled";',
      version: 'v2',
      sourceMode: 'js-template',
      settings: { compiled: true },
    });

    registry.clear();
    await expect(
      resolveRuntimeRunJS(
        {
          runJs: {
            code: 'return "fallback";',
            version: 'v1',
            sourceMode: 'js-template',
            sourceBinding: { templateId: 'template-1' },
          },
        },
        registry,
      ),
    ).resolves.toMatchObject({ code: 'return "fallback";', version: 'v1', sourceMode: 'js-template' });
  });

  it('creates a delegated runtime context and returns the existing runjs execution result', async () => {
    const runjs = vi.fn(async () => ({ success: true, value: 'executed' }));
    const baseContext = { api: { request: vi.fn() }, runjs };
    const resolved = {
      code: 'return ctx.settings.value;',
      version: 'v2',
      sourceMode: 'inline',
      settings: { value: 42 },
    };
    const runtimeContext = createRunJSRuntimeContext(baseContext, resolved) as Record<string, unknown>;

    expect(Object.getPrototypeOf(runtimeContext)).toBe(baseContext);
    expect(runtimeContext.settings).toEqual({ value: 42 });
    await expect(evaluateResolvedRunJSValue({ ctx: baseContext, resolved })).resolves.toBe('executed');
    expect(runjs).toHaveBeenCalledWith('return ctx.settings.value;', undefined, { version: 'v2' });
  });

  it('evaluates through a FlowContext while exposing resolved settings and source metadata', async () => {
    const engine = new FlowEngine();

    await expect(
      evaluateResolvedRunJSValue({
        ctx: engine.context,
        resolved: {
          code: 'return [ctx.settings.region, ctx.runJsSource.sourceMode, typeof window];',
          version: 'v2',
          sourceMode: 'inline',
          settings: { region: 'APAC' },
        },
      }),
    ).resolves.toEqual(['APAC', 'inline', 'object']);
  });

  it.each([
    Object.assign(new Error('permission denied'), { code: 'JS_TEMPLATE_PERMISSION_DENIED', status: 403 }),
    Object.assign(new Error('settings invalid'), { code: 'JS_TEMPLATE_SETTINGS_INVALID', status: 422 }),
    Object.assign(new Error('binding conflict'), { code: 'JS_TEMPLATE_BINDING_OUTDATED', status: 409 }),
  ])('does not replace permission or data errors with a retained artifact', async (resolverError) => {
    const registry = new RunJSSourceResolverRegistryManager();
    registry.registerResolver({
      sourceMode: 'js-template',
      resolve: async () => {
        throw resolverError;
      },
    });

    await expect(
      resolveRuntimeRunJS(
        {
          runJs: {
            code: 'return "fallback";',
            version: 'v2',
            sourceMode: 'js-template',
            sourceBinding: { templateId: 'template-1' },
          },
        },
        registry,
      ),
    ).rejects.toBe(resolverError);
  });

  it.each([
    Object.assign(new Error('runtime unavailable'), { code: 'JS_TEMPLATE_RUNTIME_UNAVAILABLE', status: 409 }),
    Object.assign(new Error('service unavailable'), { response: { status: 503 } }),
  ])('uses a retained artifact for an unavailable resolver', async (resolverError) => {
    const registry = new RunJSSourceResolverRegistryManager();
    registry.registerResolver({
      sourceMode: 'js-template',
      resolve: async () => {
        throw resolverError;
      },
    });

    await expect(
      resolveRuntimeRunJS(
        {
          runJs: {
            code: 'return "fallback";',
            version: 'v2',
            sourceMode: 'js-template',
            sourceBinding: { templateId: 'template-1' },
          },
        },
        registry,
      ),
    ).resolves.toMatchObject({ code: 'return "fallback";', sourceMode: 'js-template' });
  });

  it('keeps model-use and structured runtime error behavior for all retained hosts', () => {
    for (const modelUse of ['JSBlockModel', 'JSFieldModel', 'JSColumnModel', 'JSActionModel', 'JSItemModel']) {
      expect(getRunJSModelUse({ createModelOptions: { use: modelUse } })).toBe(modelUse);
    }
    expect(
      readRunJSRuntimeError({
        response: {
          status: 422,
          data: {
            errors: [
              {
                code: 'JS_TEMPLATE_SETTINGS_INVALID',
                message: 'Settings invalid',
                details: { reasonCode: 'settings_invalid', issues: [{ path: '$.count' }] },
              },
            ],
          },
        },
      }),
    ).toMatchObject({
      code: 'JS_TEMPLATE_SETTINGS_INVALID',
      status: 422,
      reasonCode: 'settings_invalid',
      paths: ['$.count'],
    });
  });
});
