/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { FormItem } from '@formily/antd-v5';
import { createSchemaField, FormProvider } from '@formily/react';
import { render, screen } from '@testing-library/react';
import type { FlowModel } from '@nocobase/flow-engine';
import { setupRunJSTestHosts } from '@nocobase/test/client-v2';
import React from 'react';

import { RunJSSettingsDescriptorProviderRegistry, RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import {
  createJsTemplateSettingStep,
  createJsTemplateSourcePlumbing,
  createRuntimeRunTracker,
  getJsTemplateSettingsDescriptor,
  normalizeJsTemplateRuntimeError,
  normalizeJsTemplateSourceSettings,
  normalizeJsTemplateSourceSettingsForBinding,
  setCanonicalJsTemplateSource,
  stableSerialize,
} from '../runjsSourceRuntimeCommon';

function createDataSourceContext() {
  const users = {
    name: 'users',
    title: 'Users',
    getFields: () => [
      { name: 'username', title: 'Username' },
      { name: 'nickname', title: 'Nickname' },
      { name: 'hiddenField', title: 'Hidden field', options: { hidden: true } },
    ],
  };
  const orders = { name: 'orders', title: 'Orders', getFields: () => [] };
  const hidden = { name: 'hidden', title: 'Hidden', hidden: true, getFields: () => [] };
  const dataSource = {
    key: 'main',
    getCollections: () => [users, orders, hidden],
    getCollection: (name: string) => [users, orders, hidden].find((collection) => collection.name === name),
  };
  return {
    dataSourceManager: {
      getDataSource: (key: string) => (key === 'main' ? dataSource : undefined),
      getDataSources: () => [dataSource],
    },
  } as never;
}

setupRunJSTestHosts();

describe('runjsSourceRuntimeCommon', () => {
  beforeEach(() => {
    RunJSSourceResolverRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
  });

  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
  });

  it('tracks the latest run per model independently', () => {
    const tracker = createRuntimeRunTracker();
    const firstModel = {};
    const secondModel = {};

    const firstRun = tracker.begin(firstModel);
    const secondRun = tracker.begin(firstModel);

    expect(tracker.isCurrent(firstModel, firstRun)).toBe(false);
    expect(tracker.isCurrent(firstModel, secondRun)).toBe(true);
    expect(tracker.isCurrent(secondModel, secondRun)).toBe(false);
  });

  it('owns the shared source defaults, descriptor, title, and save plumbing', async () => {
    const sourceBinding = { templateId: 'jtt_1', projectId: 'jtp_1' };
    const getSettingsDescriptor = vi.fn(async () => ({
      entryId: 'jtt_1',
      schema: null,
      defaults: {},
      settingsSchemaHash: null,
    }));
    const getBindingTitle = vi.fn(async () => 'Shared entry');
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: async () => ({ code: 'return true;' }),
      getSettingsDescriptor,
      getBindingTitle,
    });

    let runJs: Record<string, unknown> = { sourceMode: 'legacy', code: 'return false;', settings: { stale: true } };
    const model = {
      uid: 'model_1',
      context: { t: (key: string) => key },
      getStepParams: () => runJs,
      setStepParams: (_flowKey: string, params: { runJs: Record<string, unknown> }) => {
        runJs = params.runJs;
      },
    } as unknown as FlowModel;
    const afterParamsSave = vi.fn(async () => undefined);
    const plumbing = createJsTemplateSourcePlumbing({
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      ownerKind: 'flowModel.blockSettings',
      getOwnerLocator: (owner) => ({ modelUid: owner.uid }),
      afterParamsSave,
    });
    const ctx = { model } as never;

    expect(plumbing.getSourceDefaultParams(ctx)).toEqual({
      sourceMode: 'inline',
      sourceBinding: undefined,
      settings: { stale: true },
    });

    await plumbing.beforeParamsSave(ctx, { sourceMode: 'js-template', sourceBinding, settings: {} });

    expect(runJs).toMatchObject({
      sourceMode: 'js-template',
      sourceBinding,
      settings: {},
      code: 'return false;',
    });
    expect(getSettingsDescriptor).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceBinding,
        context: expect.objectContaining({ ownerKind: 'flowModel.blockSettings' }),
      }),
    );
    await expect(plumbing.getEditorTitle(model)).resolves.toBe('Write JavaScript (JS Template: Shared entry)');
    expect(getBindingTitle).toHaveBeenCalledOnce();

    await plumbing.afterSourceParamsSave(ctx);
    expect(afterParamsSave).toHaveBeenCalledOnce();
  });

  it('uses the step title without repeating it in the rendered FormItem', () => {
    const [, step] = createJsTemplateSettingStep<FlowModel>({
      entryId: 'jtt_display',
      fieldName: 'displayOptions',
      fieldSchema: {
        type: 'object',
        title: 'Display settings',
        properties: {
          color: { type: 'string', title: 'Color' },
        },
      },
      required: false,
      stepKey: 'display-options',
      defaultValue: { color: 'blue' },
      sort: 700,
      component: 'SettingsSingleField',
      rootSchema: { type: 'object' },
      descriptorDefaults: {},
      savedRootValue: {},
      syncValue: () => undefined,
      afterParamsSave: async () => undefined,
    });
    const SettingsSingleField = () => React.createElement('div', null, 'Color');
    const SchemaField = createSchemaField({
      components: {
        FormItem,
        SettingsSingleField,
      },
    });
    const form = createForm({ values: { value: { color: 'blue' } } });
    const uiSchema = typeof step.uiSchema === 'function' ? {} : step.uiSchema;

    render(
      React.createElement(
        FormProvider,
        { form },
        React.createElement(SchemaField, {
          schema: {
            type: 'object',
            properties: uiSchema,
          },
        }),
      ),
    );

    expect(step.title).toBe('Display settings');
    expect(screen.queryByText('Display settings')).not.toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('renders boolean settings as an inline switch', () => {
    const [, step] = createJsTemplateSettingStep<FlowModel>({
      entryId: 'jtt_boolean',
      fieldName: 'showCard',
      fieldSchema: {
        type: 'boolean',
        title: 'Show block card',
      },
      required: false,
      stepKey: 'show-card',
      defaultValue: true,
      sort: 700,
      component: 'SettingsSingleField',
      rootSchema: { type: 'object' },
      descriptorDefaults: { showCard: true },
      savedRootValue: { showCard: true },
      syncValue: () => undefined,
      afterParamsSave: async () => undefined,
    });

    expect(step.uiMode).toEqual({ type: 'switch', key: 'value' });
    const defaultParams = step.defaultParams;
    expect(typeof defaultParams === 'function' ? defaultParams({} as never) : defaultParams).toEqual({ value: true });
  });

  it('renders collection settings as an inline searchable select with all visible collections', async () => {
    const [, step] = createJsTemplateSettingStep<FlowModel>({
      entryId: 'jtt_collection',
      fieldName: 'collectionName',
      fieldSchema: {
        type: 'string',
        title: 'Collection',
        'x-component': 'CollectionSelect',
      },
      required: true,
      stepKey: 'collection-name',
      defaultValue: 'users',
      sort: 700,
      component: 'SettingsSingleField',
      rootSchema: { type: 'object' },
      descriptorDefaults: {},
      savedRootValue: { collectionName: 'users' },
      syncValue: () => undefined,
      afterParamsSave: async () => undefined,
    });
    const uiMode = typeof step.uiMode === 'function' ? await step.uiMode(createDataSourceContext()) : step.uiMode;

    expect(uiMode).toEqual({
      type: 'select',
      key: 'value',
      props: {
        allowClear: true,
        optionFilterProp: 'label',
        showSearch: true,
        options: [
          { label: 'Users', value: 'users' },
          { label: 'Orders', value: 'orders' },
        ],
      },
    });
  });

  it('renders collection field settings from the selected collection as an inline select', async () => {
    const [, step] = createJsTemplateSettingStep<FlowModel>({
      entryId: 'jtt_collection_field',
      fieldName: 'displayField',
      fieldSchema: {
        type: 'string',
        title: 'Display field',
        'x-component': 'CollectionFieldSelect',
        'x-component-props': { collectionField: 'collectionName' },
      },
      required: true,
      stepKey: 'display-field',
      defaultValue: 'username',
      sort: 701,
      component: 'SettingsSingleField',
      rootSchema: { type: 'object' },
      descriptorDefaults: {},
      savedRootValue: { collectionName: 'users', displayField: 'username' },
      syncValue: () => undefined,
      afterParamsSave: async () => undefined,
    });
    const uiMode = typeof step.uiMode === 'function' ? await step.uiMode(createDataSourceContext()) : step.uiMode;

    expect(uiMode).toMatchObject({
      type: 'select',
      key: 'value',
      props: {
        options: [
          { label: 'Username', value: 'username' },
          { label: 'Nickname', value: 'nickname' },
        ],
      },
    });
  });

  it('rejects JS Template source saves when the settings descriptor is unavailable', () => {
    expect(() =>
      normalizeJsTemplateSourceSettings({
        currentRunJs: { sourceBinding: { templateId: 'old' }, settings: { mode: 2 } },
        nextSourceMode: 'js-template',
        nextSourceBinding: { templateId: 'next' },
        nextSettings: { mode: 2 },
        descriptor: null,
      }),
    ).toThrow('JS Template settings descriptor is required.');
  });

  it('accepts an explicit null schema hash when the entry has no settings schema', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'js-template',
      resolve: async () => ({ code: 'return true;' }),
      getSettingsDescriptor: async () => ({
        entryId: 'jtt_without_schema',
        schema: null,
        defaults: {},
        settingsSchemaHash: null,
      }),
    });

    await expect(
      getJsTemplateSettingsDescriptor({
        modelUid: 'model_1',
        ownerKind: 'flowModel.step',
        ownerLocator: { kind: 'flowModel.step' },
        params: {
          sourceMode: 'js-template',
          sourceBinding: { templateId: 'jtt_without_schema' },
        },
      }),
    ).resolves.toEqual({
      entryId: 'jtt_without_schema',
      schema: null,
      defaults: {},
      settingsSchemaHash: null,
    });
  });

  it('loads inline settings descriptors with the persisted source reference and exact locator', async () => {
    const getSettingsDescriptor = vi.fn(async () => ({
      entryId: 'inline:repo_1:welcome',
      settingsSchemaHash: 'commit_2:schema_1',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string', default: 'Welcome' },
        },
      },
      defaults: { title: 'Welcome' },
    }));
    RunJSSettingsDescriptorProviderRegistry.registerProvider({
      key: 'inline-js-template',
      canHandle: (input) => input.sourceMode === 'inline',
      getSettingsDescriptor,
    });
    const sourceLocator = {
      kind: 'flowModel.step' as const,
      modelUid: 'model_1',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
      versionPath: ['version'],
    };

    await expect(
      getJsTemplateSettingsDescriptor({
        modelUid: 'model_1',
        ownerKind: 'flowModel.blockSettings',
        ownerLocator: { modelUid: 'model_1' },
        sourceLocator,
        params: {
          code: 'ctx.render(<div />);',
          version: 'v2',
          sourceMode: 'inline',
          sourceRef: {
            type: 'vsc-file',
            repoId: 'repo_1',
            commitId: 'commit_2',
            entry: 'src/client/index.tsx',
          },
          settings: { title: 'Revenue' },
        },
      }),
    ).resolves.toMatchObject({
      entryId: 'inline:repo_1:welcome',
      defaults: { title: 'Welcome' },
    });
    expect(getSettingsDescriptor).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'inline',
        sourceRef: expect.objectContaining({ repoId: 'repo_1', commitId: 'commit_2' }),
        settings: { title: 'Revenue' },
        runJs: expect.objectContaining({ code: 'ctx.render(<div />);', version: 'v2' }),
        locator: sourceLocator,
      }),
    );
  });

  it('preserves complete settings when switching to inline source mode', () => {
    const settings = {
      enabled: false,
      count: 0,
      label: '',
      nested: { visible: false, hiddenValue: 'keep-me' },
    };

    expect(
      normalizeJsTemplateSourceSettingsForBinding({
        currentRunJs: {
          sourceMode: 'js-template',
          sourceBinding: { templateId: 'jtt_1' },
          settings,
        },
        nextSourceMode: 'inline',
        nextSettings: settings,
      }),
    ).toEqual({ settings, missingRequiredPaths: [] });
  });

  it('preserves legacy inline fallback fields when binding a JS Template', () => {
    const setStepParams = vi.fn();
    const sourceRef = { type: 'vsc-file', path: 'legacy/runjs.ts' };
    const model = {
      getStepParams: () => ({
        code: 'ctx.render("legacy inline");',
        version: 'v1',
        sourceRef,
      }),
      setStepParams,
    } as never;
    const sourceBinding = {
      type: 'js-template-entry',
      projectId: 'jtp_1',
      templateId: 'jtt_1',
      kind: 'js-block',
    };

    setCanonicalJsTemplateSource(model, 'jsSettings', {
      sourceMode: 'js-template',
      sourceBinding,
      settings: { region: 'APAC' },
    });

    expect(setStepParams).toHaveBeenCalledWith('jsSettings', {
      runJs: {
        code: 'ctx.render("legacy inline");',
        version: 'v1',
        sourceRef,
        sourceMode: 'js-template',
        sourceBinding,
        settings: { region: 'APAC' },
      },
    });
  });

  it('pins empty inline code when switching from a js-template-only binding', () => {
    const setStepParams = vi.fn();
    const sourceBinding = {
      type: 'js-template-entry',
      projectId: 'jtp_1',
      templateId: 'jtt_1',
      kind: 'js-block',
    };
    const model = {
      getStepParams: () => ({
        version: 'v2',
        sourceMode: 'js-template',
        sourceBinding,
        settings: { title: 'Sales' },
      }),
      setStepParams,
    } as never;

    setCanonicalJsTemplateSource(model, 'jsSettings', {
      sourceMode: 'inline',
      sourceBinding: undefined,
      settings: { title: 'Sales' },
    });

    expect(setStepParams).toHaveBeenCalledWith('jsSettings', {
      runJs: {
        version: 'v2',
        sourceMode: 'inline',
        code: '',
        settings: { title: 'Sales' },
      },
    });
    expect(setStepParams.mock.calls[0][1].runJs).not.toHaveProperty('sourceBinding');
  });

  it('keeps existing inline code when switching back from a JS Template binding', () => {
    const setStepParams = vi.fn();
    const model = {
      getStepParams: () => ({
        code: 'ctx.render("kept inline");',
        version: 'v1',
        sourceMode: 'js-template',
        sourceBinding: {
          type: 'js-template-entry',
          projectId: 'jtp_1',
          templateId: 'jtt_1',
          kind: 'js-block',
        },
        settings: {},
      }),
      setStepParams,
    } as never;

    setCanonicalJsTemplateSource(model, 'jsSettings', {
      sourceMode: 'inline',
      settings: {},
    });

    expect(setStepParams).toHaveBeenCalledWith('jsSettings', {
      runJs: {
        code: 'ctx.render("kept inline");',
        version: 'v1',
        sourceMode: 'inline',
        settings: {},
      },
    });
  });

  it('rejects binding settings when the entry declares no settings schema', () => {
    let caught: unknown;
    try {
      normalizeJsTemplateSourceSettingsForBinding({
        currentRunJs: {
          sourceBinding: { templateId: 'jtt_without_schema' },
          settings: { unexpected: true },
        },
        nextSourceMode: 'js-template',
        nextSourceBinding: { templateId: 'jtt_without_schema' },
        nextSettings: { unexpected: true },
        descriptor: {
          entryId: 'jtt_without_schema',
          schema: null,
          defaults: {},
          settingsSchemaHash: null,
        },
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ code: 'JS_TEMPLATE_SETTINGS_INVALID', paths: ['unexpected'] });
  });

  it('allows missing required settings in binding mode and reports nested paths', () => {
    const result = normalizeJsTemplateSourceSettingsForBinding({
      currentRunJs: {},
      nextSourceMode: 'js-template',
      nextSourceBinding: { templateId: 'jtt_required' },
      nextSettings: {},
      descriptor: {
        entryId: 'jtt_required',
        settingsSchemaHash: 'schema_required',
        defaults: {},
        schema: {
          type: 'object',
          required: ['title', 'options'],
          properties: {
            title: { type: 'string' },
            options: {
              type: 'object',
              required: ['limit'],
              properties: {
                limit: { type: 'integer' },
              },
            },
          },
        },
      },
    });

    expect(result).toEqual({
      settings: {},
      missingRequiredPaths: ['title', 'options'],
    });
    expect(result.missingRequiredPaths).not.toContain('');
  });

  it('reports nested required paths when the parent object exists', () => {
    const result = normalizeJsTemplateSourceSettingsForBinding({
      currentRunJs: { sourceBinding: { templateId: 'jtt_nested' }, settings: { options: {} } },
      nextSourceMode: 'js-template',
      nextSourceBinding: { templateId: 'jtt_nested' },
      nextSettings: { options: {} },
      descriptor: {
        entryId: 'jtt_nested',
        settingsSchemaHash: 'schema_nested',
        defaults: {},
        schema: {
          type: 'object',
          required: ['options'],
          properties: {
            options: {
              type: 'object',
              required: ['limit'],
              properties: { limit: { type: 'integer' } },
            },
          },
        },
      },
    });

    expect(result.missingRequiredPaths).toEqual(['options.limit']);
  });

  it('treats schema defaults as satisfying required settings without persisting them as overrides', () => {
    const result = normalizeJsTemplateSourceSettingsForBinding({
      currentRunJs: {},
      nextSourceMode: 'js-template',
      nextSourceBinding: { templateId: 'jtt_defaults' },
      nextSettings: {},
      descriptor: {
        entryId: 'jtt_defaults',
        settingsSchemaHash: 'schema_defaults',
        defaults: {},
        schema: {
          type: 'object',
          required: ['title'],
          properties: { title: { type: 'string', default: 'Default title' } },
        },
      },
    });

    expect(result).toEqual({ settings: {}, missingRequiredPaths: [] });
  });

  it('rejects explicit invalid binding settings', () => {
    let caught: unknown;
    try {
      normalizeJsTemplateSourceSettingsForBinding({
        currentRunJs: { sourceBinding: { templateId: 'jtt_invalid' }, settings: {} },
        nextSourceMode: 'js-template',
        nextSourceBinding: { templateId: 'jtt_invalid' },
        nextSettings: { count: 'invalid' },
        descriptor: {
          entryId: 'jtt_invalid',
          settingsSchemaHash: 'schema_invalid',
          defaults: {},
          schema: {
            type: 'object',
            properties: { count: { type: 'integer' } },
          },
        },
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toMatchObject({ code: 'JS_TEMPLATE_SETTINGS_INVALID', paths: ['count'] });
  });

  it('prunes explicitly submitted and stored unknown paths for the same entry', () => {
    expect(
      normalizeJsTemplateSourceSettingsForBinding({
        currentRunJs: {
          sourceBinding: { templateId: 'jtt_existing_unknown' },
          settings: { count: 1, unknown: 'stored' },
        },
        nextSourceMode: 'js-template',
        nextSourceBinding: { templateId: 'jtt_existing_unknown' },
        nextSettings: { count: 2, unknown: 'submitted' },
        descriptor: {
          entryId: 'jtt_existing_unknown',
          settingsSchemaHash: 'schema_existing_unknown',
          defaults: {},
          schema: {
            type: 'object',
            properties: { count: { type: 'integer' } },
          },
        },
      }),
    ).toEqual({ settings: { count: 2 }, missingRequiredPaths: [] });
  });

  it.each([
    ['JS_TEMPLATE_BINDING_OUTDATED', 409, 'JS Template binding is outdated', 'Refresh this surface'],
    ['JS_TEMPLATE_SETTINGS_INVALID', 422, 'JS Template settings are invalid', 'Fix settings'],
    ['JS_TEMPLATE_NOT_FOUND', 404, 'JS Template missing', 'Choose an available template or restore this template.'],
    [
      'JS_TEMPLATE_PROJECT_NOT_FOUND',
      404,
      'JS Template project missing',
      'Choose an available project or restore this project.',
    ],
    [
      'JS_TEMPLATE_FORBIDDEN',
      403,
      'JS Template access denied',
      'Ask an administrator for permission to use this JS Template.',
    ],
    [
      'JS_TEMPLATE_PROJECT_ARCHIVED',
      409,
      'JS Template project is archived',
      'Restore the project or choose a template from another project.',
    ],
    [undefined, 403, 'JS Template access denied', 'Ask an administrator for permission to use this JS Template.'],
    [undefined, 404, 'JS Template missing', 'Choose an available template or restore this template.'],
  ])('normalizes %s server errors into the shared UI state', (code, status, title, hint) => {
    const message = code || 'Request failed';
    const result = normalizeJsTemplateRuntimeError(
      {
        response: {
          status,
          data: {
            errors: [{ ...(code ? { code } : {}), message }],
          },
        },
      },
      {
        defaultTitle: 'Runtime error',
        defaultHint: 'Retry',
        defaultMessage: 'Failed',
        outdatedHint: 'Refresh this surface',
        invalidSettingsHint: 'Fix settings',
      },
    );

    expect(result).toEqual({
      title,
      hint,
      message,
      ...(code ? { code } : {}),
      status,
    });
  });

  it('serializes records with stable key ordering', () => {
    expect(stableSerialize({ second: 2, first: { beta: 2, alpha: 1 } })).toBe(
      '{"first":{"alpha":1,"beta":2},"second":2}',
    );
  });
});
