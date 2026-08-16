/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createRunJSClientHosts,
  installRunJSClientHosts,
  readRunJSRuntimeError,
  resolveRuntimeRunJS,
  RunJSEditorProviderRegistry,
  RunJSSettingsDescriptorProviderRegistryManager,
  RunJSSourceResolverRegistryManager,
} from '..';

describe('@nocobase/runjs/client', () => {
  it('keeps registry priority and stale-disposer identity semantics', async () => {
    const editors = new RunJSEditorProviderRegistry();
    const disposeFirstEditor = editors.registerProvider({ key: 'same', priority: 1, renderEditor: () => null });
    const replacementEditor = { key: 'same', priority: 20, renderEditor: () => null };
    const disposeReplacementEditor = editors.registerProvider(replacementEditor);
    editors.registerProvider({ key: 'lower', priority: 10, renderEditor: () => null });

    disposeFirstEditor();
    expect(editors.getProviders()).toEqual([replacementEditor, expect.objectContaining({ key: 'lower' })]);
    disposeReplacementEditor();
    expect(editors.getProviders().map((provider) => provider.key)).toEqual(['lower']);

    const resolvers = new RunJSSourceResolverRegistryManager();
    const disposeFirstResolver = resolvers.registerResolver({
      sourceMode: ' custom ',
      resolve: () => ({ code: 'first' }),
    });
    const replacementResolver = { sourceMode: 'custom', resolve: vi.fn(() => ({ code: 'second' })) };
    const disposeReplacementResolver = resolvers.registerResolver(replacementResolver);

    disposeFirstResolver();
    const resolver = resolvers.getResolver(' custom ');
    if (!resolver) {
      throw new Error('Expected resolver');
    }
    expect(await resolver.resolve({ sourceMode: 'custom', sourceBinding: {} })).toEqual({ code: 'second' });
    disposeReplacementResolver();
    expect(resolvers.getResolver('custom')).toBeNull();
  });

  it('queries settings providers by priority and preserves replacements', async () => {
    const providers = new RunJSSettingsDescriptorProviderRegistryManager();
    const disposeFirst = providers.registerProvider({
      key: 'same',
      priority: 1,
      getSettingsDescriptor: () => ({ entryId: 'first', settingsSchemaHash: null }),
    });
    const replacement = {
      key: 'same',
      priority: 30,
      getSettingsDescriptor: vi.fn(() => ({ entryId: 'replacement', settingsSchemaHash: 'hash' })),
    };
    providers.registerProvider({
      key: 'fallback',
      priority: 10,
      getSettingsDescriptor: () => ({ entryId: 'fallback', settingsSchemaHash: null }),
    });
    const disposeReplacement = providers.registerProvider(replacement);

    disposeFirst();
    await expect(providers.getSettingsDescriptor({ sourceMode: 'inline' })).resolves.toEqual({
      entryId: 'replacement',
      settingsSchemaHash: 'hash',
    });
    disposeReplacement();
    await expect(providers.getSettingsDescriptor({ sourceMode: 'inline' })).resolves.toEqual({
      entryId: 'fallback',
      settingsSchemaHash: null,
    });
  });

  it('resolves inline and external sources while retaining only safe last-known-good artifacts', async () => {
    await expect(resolveRuntimeRunJS({ runJs: { code: 'return 1;' }, settings: { enabled: true } })).resolves.toEqual({
      code: 'return 1;',
      version: 'v1',
      sourceMode: 'inline',
      settings: { enabled: true },
      context: undefined,
    });

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
    ).resolves.toMatchObject({ code: 'return "compiled";', version: 'v2', sourceMode: 'js-template' });

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

  it('creates a runtime host around the client-provided context factory', async () => {
    const runjs = vi.fn(async () => ({ success: true, value: 'executed' }));
    const baseContext = { api: { request: vi.fn() }, runjs };
    const hosts = createRunJSClientHosts(createRuntimeContext);
    const resolved = {
      code: 'return ctx.settings.value;',
      version: 'v2',
      sourceMode: 'inline',
      settings: { value: 42 },
    };

    const runtimeContext = hosts.runtimeHost.createRuntimeContext(baseContext, resolved) as Record<string, unknown>;
    expect(Object.getPrototypeOf(runtimeContext)).toBe(baseContext);
    expect(runtimeContext.settings).toEqual({ value: 42 });
    await expect(hosts.runtimeHost.evaluateResolvedValue({ ctx: baseContext, resolved })).resolves.toBe('executed');
    expect(runjs).toHaveBeenCalledWith('return ctx.settings.value;', undefined, { version: 'v2' });

    await hosts.runtimeHost.evaluateInlineValue({ ctx: baseContext, runJs: { code: '' } });
    expect(runjs).toHaveBeenLastCalledWith('', undefined, { version: 'v1' });
  });

  it('reads structured runtime errors and model-use metadata', () => {
    const hosts = createRunJSClientHosts(createRuntimeContext);
    for (const modelUse of ['JSBlockModel', 'JSFieldModel', 'JSColumnModel', 'JSActionModel', 'JSItemModel']) {
      expect(hosts.runtimeHost.getModelUse({ createModelOptions: { use: modelUse } })).toBe(modelUse);
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

  it('rolls back partial installation and disposes hosts in reverse order exactly once', () => {
    const hosts = createRunJSClientHosts(createRuntimeContext);
    const rollbackOrder: string[] = [];
    const error = new Error('runtime registration failed');

    expect(() =>
      installRunJSClientHosts(
        {
          registerRegistryHost: () => () => rollbackOrder.push('registry'),
          registerRuntimeHost: () => {
            throw error;
          },
        },
        hosts,
      ),
    ).toThrow(error);
    expect(rollbackOrder).toEqual(['registry']);

    const disposeOrder: string[] = [];
    const dispose = installRunJSClientHosts(
      {
        registerRegistryHost: () => () => disposeOrder.push('registry'),
        registerRuntimeHost: () => () => disposeOrder.push('runtime'),
      },
      hosts,
    );
    dispose();
    dispose();
    expect(disposeOrder).toEqual(['runtime', 'registry']);
  });
});

function createRuntimeContext(baseCtx: unknown, resolved: { settings: Record<string, unknown> }): unknown {
  const context: Record<string, unknown> = isRecord(baseCtx) ? Object.create(baseCtx) : {};
  context.settings = resolved.settings;
  return context;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
