/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

import {
  buildLightExtensionSettingsSchema,
  getLightExtensionClientAppStaticRoot,
  LIGHT_EXTENSION_CLIENT_APP_ENTRY_SCHEMA_URI,
  LIGHT_EXTENSION_CLIENT_APP_ENTRY_SCHEMA_VERSION,
  LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
  LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
  LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
  LIGHT_EXTENSION_SETTINGS_CONDITION_LIMITS,
  LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS,
  LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS,
  LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS,
  LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES,
  LIGHT_EXTENSION_X_COMPONENT_WHITELIST,
  lightExtensionClientAppEntryV1Schema,
  lightExtensionEntryV1Schema,
  lightExtensionEntryV1SchemaJson,
  parseLightExtensionClientAppEntryV1,
  parseLightExtensionClientAppEntryV1Json,
} from '../schema';
import {
  lightExtensionClientAppEntryV1SchemaFileContent,
  lightExtensionClientAppEntryV1SchemaSha256,
  lightExtensionEntryV1SchemaFileContent,
  lightExtensionEntryV1SchemaSha256,
} from '../schema/server';

describe('@nocobase/light-extension-sdk entry.json schema', () => {
  const ajv = new Ajv({ allErrors: true, jsonPointers: true });
  const validate = ajv.compile(lightExtensionEntryV1Schema);

  it('passes JSON Schema meta-validation and validates the canonical example', () => {
    expect(ajv.validateSchema(lightExtensionEntryV1Schema)).toBe(true);
    expect(validate(lightExtensionEntryV1Schema.examples[0])).toBe(true);
    const canonicalFile = fs.readFileSync(path.resolve(__dirname, '../schema/entry-v1.schema.json'), 'utf8');
    expect(lightExtensionEntryV1SchemaFileContent).toBe(canonicalFile);
    expect(lightExtensionEntryV1SchemaSha256).toBe('d1cfa4aeaa94365780b8cc2d7e17aea04fccbfd7522002c35943534f1fa80d89');
  });

  it('locks canonical constants to the schema', () => {
    const schema = lightExtensionEntryV1Schema;
    const settingsSchema = schema.definitions.settingsSchema;
    const conditionRefs = schema.definitions.condition.oneOf.map((item) => item.$ref);

    expect(schema.$id).toBe(LIGHT_EXTENSION_ENTRY_SCHEMA_URI);
    expect(schema.properties.schemaVersion.const).toBe(LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION);
    expect(schema.properties.key.pattern).toBe(LIGHT_EXTENSION_ENTRY_KEY_PATTERN);
    expect(schema.properties).not.toHaveProperty('$schema');
    expect(schema.properties).not.toHaveProperty('settingsSchema');
    expect(schema.properties.settings.description).toContain('Settings field definitions');
    expect(schema.properties.settings.additionalProperties.$ref).toBe('#/definitions/settingsSchema');
    expect(settingsSchema.properties.type.enum).toEqual(LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES);
    expect(Object.keys(settingsSchema.properties)).toEqual(LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS);
    expect(settingsSchema.properties['x-component'].enum).toEqual(LIGHT_EXTENSION_X_COMPONENT_WHITELIST);
    expect(settingsSchema.properties['x-visible-when'].description).toContain('controls whether');
    expect(schema.definitions.conditionWithValue.properties.operator.enum).toEqual(['$eq', '$ne']);
    expect(schema.definitions.conditionWithArrayValue.properties.operator.enum).toEqual(['$in', '$notIn']);
    expect(schema.definitions.conditionWithoutValue.properties.operator.enum).toEqual(['$empty', '$notEmpty']);
    expect(schema.definitions.conditionGroup.properties.logic.enum).toEqual(LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS);
    expect(schema.definitions.conditionGroup.properties.items.maxItems).toBe(
      LIGHT_EXTENSION_SETTINGS_CONDITION_LIMITS.maxItemsPerGroup,
    );
    expect(conditionRefs).toHaveLength(4);
    expect([
      ...schema.definitions.conditionWithValue.properties.operator.enum,
      ...schema.definitions.conditionWithArrayValue.properties.operator.enum,
      ...schema.definitions.conditionWithoutValue.properties.operator.enum,
    ]).toEqual(LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS);
  });

  it('rejects legacy fields, old kinds of expressions, and malformed conditions', () => {
    expect(validate({ schemaVersion: 1, key: 'sales', meta: {} })).toBe(false);
    expect(
      validate({
        schemaVersion: 1,
        key: 'sales',
        settings: {
          mode: {
            type: 'string',
            'x-visible-when': { path: 'enabled', operator: '$contains', value: true },
          },
        },
      }),
    ).toBe(false);
    expect(
      validate({
        schemaVersion: 1,
        key: 'sales',
        $schema: LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
      }),
    ).toBe(false);
    expect(
      validate({
        schemaVersion: 1,
        key: 'sales',
        settingsSchema: { type: 'object', properties: {} },
      }),
    ).toBe(false);
    expect(lightExtensionEntryV1SchemaJson).not.toMatch(/meta\.json|settings\.json|"runjs"|\$not"/u);
  });

  it('allows visibility only on object properties outside array item subtrees', () => {
    expect(
      validate({
        schemaVersion: 1,
        key: 'root-condition',
        settings: {
          'x-visible-when': { path: 'enabled', operator: '$eq', value: true },
          enabled: { type: 'boolean' },
        },
      }),
    ).toBe(false);
    expect(
      validate({
        schemaVersion: 1,
        key: 'array-condition',
        settings: {
          enabled: { type: 'boolean' },
          rows: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  'x-visible-when': { path: 'enabled', operator: '$eq', value: true },
                },
              },
            },
          },
        },
      }),
    ).toBe(false);
  });

  it('normalizes required flags recursively through objects and array items', () => {
    expect(
      buildLightExtensionSettingsSchema({
        mode: { type: 'string', required: true },
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', required: true },
              options: {
                type: 'object',
                properties: {
                  enabled: { type: 'boolean', required: true },
                },
              },
            },
          },
        },
      }),
    ).toEqual({
      type: 'object',
      required: ['mode'],
      properties: {
        mode: { type: 'string' },
        groups: {
          type: 'array',
          items: {
            type: 'object',
            required: ['label'],
            properties: {
              label: { type: 'string' },
              options: {
                type: 'object',
                required: ['enabled'],
                properties: {
                  enabled: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    });
  });
});

describe('@nocobase/light-extension-sdk client-app entry.json schema', () => {
  const ajv = new Ajv({ allErrors: true, jsonPointers: true });
  const validate = ajv.compile(lightExtensionClientAppEntryV1Schema);

  it('validates the dedicated schema without changing the RunJS schema contract', () => {
    expect(ajv.validateSchema(lightExtensionClientAppEntryV1Schema)).toBe(true);
    expect(lightExtensionClientAppEntryV1Schema.$id).toBe(LIGHT_EXTENSION_CLIENT_APP_ENTRY_SCHEMA_URI);
    expect(lightExtensionClientAppEntryV1Schema.properties.schemaVersion.const).toBe(
      LIGHT_EXTENSION_CLIENT_APP_ENTRY_SCHEMA_VERSION,
    );
    expect(lightExtensionClientAppEntryV1Schema.properties.key.pattern).toBe(LIGHT_EXTENSION_ENTRY_KEY_PATTERN);
    expect(lightExtensionClientAppEntryV1Schema.properties.entry.default).toBe('index.html');
    expect(validate(lightExtensionClientAppEntryV1Schema.examples[0])).toBe(true);
    expect(lightExtensionClientAppEntryV1Schema.properties).not.toHaveProperty('settings');
    expect(lightExtensionClientAppEntryV1Schema.properties).not.toHaveProperty('root');
    expect(lightExtensionClientAppEntryV1Schema.properties).not.toHaveProperty('build');
    expect(lightExtensionClientAppEntryV1Schema.properties).not.toHaveProperty('router');
    expect(lightExtensionClientAppEntryV1Schema.properties).not.toHaveProperty('runtimeContract');

    const canonicalFile = fs.readFileSync(path.resolve(__dirname, '../schema/client-app-entry-v1.schema.json'), 'utf8');
    expect(lightExtensionClientAppEntryV1SchemaFileContent).toBe(canonicalFile);
    expect(lightExtensionClientAppEntryV1SchemaSha256).toMatch(/^[a-f0-9]{64}$/u);
  });

  it('defaults entry to index.html and preserves nested HTML entry paths', () => {
    expect(
      parseLightExtensionClientAppEntryV1({
        schemaVersion: 1,
        key: 'customer-console',
        title: 'Customer Console',
      }),
    ).toEqual({
      schemaVersion: 1,
      key: 'customer-console',
      title: 'Customer Console',
      entry: 'index.html',
    });
    expect(
      parseLightExtensionClientAppEntryV1Json(
        JSON.stringify({
          schemaVersion: 1,
          key: 'customer-console',
          title: 'Customer Console',
          entry: 'dist/application.html',
        }),
      ),
    ).toEqual({
      schemaVersion: 1,
      key: 'customer-console',
      title: 'Customer Console',
      entry: 'dist/application.html',
    });
    expect(getLightExtensionClientAppStaticRoot('index.html')).toBe('');
    expect(getLightExtensionClientAppStaticRoot('dist/application.html')).toBe('dist');
  });

  it.each([
    '/index.html',
    '../index.html',
    'dist/../../index.html',
    'dist\\index.html',
    'dist/\0index.html',
    'https://example.com/index.html',
    '//example.com/index.html',
    'dist/application.js',
  ])('rejects unsafe or non-HTML entry path %j', (entry) => {
    const descriptor = {
      schemaVersion: 1,
      key: 'customer-console',
      title: 'Customer Console',
      entry,
    };
    expect(validate(descriptor)).toBe(false);
    expect(() => parseLightExtensionClientAppEntryV1(descriptor)).toThrow(TypeError);
  });

  it('rejects fields that belong to build or runtime configuration', () => {
    for (const field of ['root', 'dist', 'build', 'router', 'serviceWorker', 'runtimeContract', 'release', 'version']) {
      const descriptor = {
        schemaVersion: 1,
        key: 'customer-console',
        title: 'Customer Console',
        [field]: 'unsupported',
      };
      expect(validate(descriptor)).toBe(false);
      expect(() => parseLightExtensionClientAppEntryV1(descriptor)).toThrow(`field "${field}" is not supported`);
    }
  });
});
