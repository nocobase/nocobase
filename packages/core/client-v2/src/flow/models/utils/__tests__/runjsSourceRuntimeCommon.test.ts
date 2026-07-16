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
import React from 'react';

import { RunJSSettingsDescriptorProviderRegistry, RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import {
  createLightExtensionSettingStep,
  createRuntimeRunTracker,
  getLightExtensionSettingsDescriptor,
  normalizeLightExtensionRuntimeError,
  normalizeLightExtensionSourceSettings,
  normalizeLightExtensionSourceSettingsForBinding,
  setCanonicalLightExtensionSource,
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

  it('uses the step title without repeating it in the rendered FormItem', () => {
    const [, step] = createLightExtensionSettingStep<FlowModel>({
      entryId: 'entry_display',
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

    render(
      React.createElement(
        FormProvider,
        { form },
        React.createElement(SchemaField, {
          schema: {
            type: 'object',
            properties: step.uiSchema,
          },
        }),
      ),
    );

    expect(step.title).toBe('Display settings');
    expect(screen.queryByText('Display settings')).not.toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('renders boolean settings as an inline switch', () => {
    const [, step] = createLightExtensionSettingStep<FlowModel>({
      entryId: 'entry_boolean',
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
    expect(step.defaultParams?.({} as never)).toEqual({ value: true });
  });

  it('renders collection settings as an inline searchable select with all visible collections', async () => {
    const [, step] = createLightExtensionSettingStep<FlowModel>({
      entryId: 'entry_collection',
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
    const [, step] = createLightExtensionSettingStep<FlowModel>({
      entryId: 'entry_collection_field',
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

  it('rejects light extension source saves when the settings descriptor is unavailable', () => {
    expect(() =>
      normalizeLightExtensionSourceSettings({
        currentRunJs: { sourceBinding: { entryId: 'old' }, settings: { mode: 2 } },
        nextSourceMode: 'light-extension',
        nextSourceBinding: { entryId: 'next' },
        nextSettings: { mode: 2 },
        descriptor: null,
      }),
    ).toThrow('Light extension settings descriptor is required.');
  });

  it('accepts an explicit null schema hash when the entry has no settings schema', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({ code: 'return true;' }),
      getSettingsDescriptor: async () => ({
        entryId: 'entry_without_schema',
        schema: null,
        defaults: {},
        settingsSchemaHash: null,
      }),
    });

    await expect(
      getLightExtensionSettingsDescriptor({
        modelUid: 'model_1',
        ownerKind: 'flowModel.step',
        ownerLocator: { kind: 'flowModel.step' },
        params: {
          sourceMode: 'light-extension',
          sourceBinding: { entryId: 'entry_without_schema' },
        },
      }),
    ).resolves.toEqual({
      entryId: 'entry_without_schema',
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
      key: 'inline-light-extension',
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
      getLightExtensionSettingsDescriptor({
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
      normalizeLightExtensionSourceSettingsForBinding({
        currentRunJs: {
          sourceMode: 'light-extension',
          sourceBinding: { entryId: 'entry_1' },
          settings,
        },
        nextSourceMode: 'inline',
        nextSettings: settings,
      }),
    ).toEqual({ settings, missingRequiredPaths: [] });
  });

  it('preserves legacy inline fallback fields when binding a light extension', () => {
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
      type: 'light-extension-entry',
      repoId: 'repo_1',
      entryId: 'entry_1',
      kind: 'js-block',
    };

    setCanonicalLightExtensionSource(model, 'jsSettings', {
      sourceMode: 'light-extension',
      sourceBinding,
      settings: { region: 'APAC' },
    });

    expect(setStepParams).toHaveBeenCalledWith('jsSettings', {
      runJs: {
        code: 'ctx.render("legacy inline");',
        version: 'v1',
        sourceRef,
        sourceMode: 'light-extension',
        sourceBinding,
        settings: { region: 'APAC' },
      },
    });
  });

  it('rejects binding settings when the entry declares no settings schema', () => {
    let caught: unknown;
    try {
      normalizeLightExtensionSourceSettingsForBinding({
        currentRunJs: {
          sourceBinding: { entryId: 'entry_without_schema' },
          settings: { unexpected: true },
        },
        nextSourceMode: 'light-extension',
        nextSourceBinding: { entryId: 'entry_without_schema' },
        nextSettings: { unexpected: true },
        descriptor: {
          entryId: 'entry_without_schema',
          schema: null,
          defaults: {},
          settingsSchemaHash: null,
        },
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ code: 'LIGHT_EXTENSION_SETTINGS_INVALID', paths: ['unexpected'] });
  });

  it('allows missing required settings in binding mode and reports nested paths', () => {
    const result = normalizeLightExtensionSourceSettingsForBinding({
      currentRunJs: {},
      nextSourceMode: 'light-extension',
      nextSourceBinding: { entryId: 'entry_required' },
      nextSettings: {},
      descriptor: {
        entryId: 'entry_required',
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
    const result = normalizeLightExtensionSourceSettingsForBinding({
      currentRunJs: { sourceBinding: { entryId: 'entry_nested' }, settings: { options: {} } },
      nextSourceMode: 'light-extension',
      nextSourceBinding: { entryId: 'entry_nested' },
      nextSettings: { options: {} },
      descriptor: {
        entryId: 'entry_nested',
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

  it('treats schema defaults as satisfying required settings', () => {
    const result = normalizeLightExtensionSourceSettingsForBinding({
      currentRunJs: {},
      nextSourceMode: 'light-extension',
      nextSourceBinding: { entryId: 'entry_defaults' },
      nextSettings: {},
      descriptor: {
        entryId: 'entry_defaults',
        settingsSchemaHash: 'schema_defaults',
        defaults: {},
        schema: {
          type: 'object',
          required: ['title'],
          properties: { title: { type: 'string', default: 'Default title' } },
        },
      },
    });

    expect(result).toEqual({ settings: { title: 'Default title' }, missingRequiredPaths: [] });
  });

  it.each([
    [{ count: 'invalid' }, 'count'],
    [{ unknown: true }, 'unknown'],
  ])('rejects explicit invalid binding settings %j', (nextSettings, invalidPath) => {
    let caught: unknown;
    try {
      normalizeLightExtensionSourceSettingsForBinding({
        currentRunJs: { sourceBinding: { entryId: 'entry_invalid' }, settings: {} },
        nextSourceMode: 'light-extension',
        nextSourceBinding: { entryId: 'entry_invalid' },
        nextSettings,
        descriptor: {
          entryId: 'entry_invalid',
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
    expect(caught).toMatchObject({ code: 'LIGHT_EXTENSION_SETTINGS_INVALID', paths: [invalidPath] });
  });

  it('rejects an explicitly submitted unknown path even when it already exists in canonical settings', () => {
    let caught: unknown;
    try {
      normalizeLightExtensionSourceSettingsForBinding({
        currentRunJs: {
          sourceBinding: { entryId: 'entry_existing_unknown' },
          settings: { unknown: 'stored' },
        },
        nextSourceMode: 'light-extension',
        nextSourceBinding: { entryId: 'entry_existing_unknown' },
        nextSettings: { unknown: 'submitted' },
        descriptor: {
          entryId: 'entry_existing_unknown',
          settingsSchemaHash: 'schema_existing_unknown',
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

    expect(caught).toMatchObject({ code: 'LIGHT_EXTENSION_SETTINGS_INVALID', paths: ['unknown'] });
  });

  it('normalizes server error envelopes without changing surface-specific hints', () => {
    const result = normalizeLightExtensionRuntimeError(
      {
        response: {
          status: 409,
          data: {
            errors: [{ code: 'binding_outdated', message: 'Refresh required' }],
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
      title: 'Light extension binding is outdated',
      hint: 'Refresh this surface',
      message: 'Refresh required',
      code: 'binding_outdated',
      status: 409,
    });
  });

  it('serializes records with stable key ordering', () => {
    expect(stableSerialize({ second: 2, first: { beta: 2, alpha: 1 } })).toBe(
      '{"first":{"alpha":1,"beta":2},"second":2}',
    );
  });
});
