/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RunJSSourceResolverRegistry } from '../../../components/runjs-source';
import {
  createRuntimeRunTracker,
  getLightExtensionSettingsDescriptor,
  normalizeLightExtensionRuntimeError,
  normalizeLightExtensionSourceSettings,
  normalizeLightExtensionSourceSettingsForBinding,
  stableSerialize,
} from '../runjsSourceRuntimeCommon';

describe('runjsSourceRuntimeCommon', () => {
  beforeEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
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
