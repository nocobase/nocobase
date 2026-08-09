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
  buildJsTemplateSettingsDefinition,
  buildJsTemplateSettingsSchema,
  JS_TEMPLATE_KEY_PATTERN,
  JS_TEMPLATE_SCHEMA_URI,
  JS_TEMPLATE_SCHEMA_VERSION,
  JS_TEMPLATE_SETTINGS_CONDITION_LIMITS,
  JS_TEMPLATE_SETTINGS_CONDITION_LOGICS,
  JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS,
  JS_TEMPLATE_SETTINGS_INFERRED_OBJECT_COMMENT,
  JS_TEMPLATE_SETTINGS_SCHEMA_KEYWORDS,
  JS_TEMPLATE_SETTINGS_SCHEMA_TYPES,
  JS_TEMPLATE_X_COMPONENT_WHITELIST,
  jsTemplateV1Schema,
  jsTemplateV1SchemaJson,
} from '../schema';
import { jsTemplateV1SchemaFileContent, jsTemplateV1SchemaSha256 } from '../schema/server';

describe('@nocobase/js-template-sdk entry.json schema', () => {
  const ajv = new Ajv({ allErrors: true, jsonPointers: true });
  const validate = ajv.compile(jsTemplateV1Schema);

  it('passes JSON Schema meta-validation and validates the canonical example', () => {
    expect(ajv.validateSchema(jsTemplateV1Schema)).toBe(true);
    expect(validate(jsTemplateV1Schema.examples[0])).toBe(true);
    const canonicalFile = fs.readFileSync(path.resolve(__dirname, '../schema/entry-v1.schema.json'), 'utf8');
    expect(jsTemplateV1SchemaFileContent).toBe(canonicalFile);
    expect(jsTemplateV1SchemaSha256).toMatch(/^[a-f0-9]{64}$/u);
  });

  it('locks canonical constants to the schema', () => {
    const schema = jsTemplateV1Schema;
    const settingsSchema = schema.definitions.settingsSchema;
    const conditionRefs = schema.definitions.condition.oneOf.map((item) => item.$ref);

    expect(schema.$id).toBe(JS_TEMPLATE_SCHEMA_URI);
    expect(schema.properties.schemaVersion.const).toBe(JS_TEMPLATE_SCHEMA_VERSION);
    expect(schema.properties.key.pattern).toBe(JS_TEMPLATE_KEY_PATTERN);
    expect(schema.properties).not.toHaveProperty('$schema');
    expect(schema.properties).not.toHaveProperty('settingsSchema');
    expect(schema.properties.settings.description).toContain('Settings field definitions');
    expect(schema.properties.settings.additionalProperties.$ref).toBe('#/definitions/settingsSchema');
    expect(settingsSchema.properties.type.enum).toEqual(JS_TEMPLATE_SETTINGS_SCHEMA_TYPES);
    expect(Object.keys(settingsSchema.properties)).toEqual(JS_TEMPLATE_SETTINGS_SCHEMA_KEYWORDS);
    expect(settingsSchema.properties['x-component'].enum).toEqual(JS_TEMPLATE_X_COMPONENT_WHITELIST);
    expect(settingsSchema.properties['x-visible-when'].description).toContain('controls whether');
    expect(schema.definitions.conditionWithValue.properties.operator.enum).toEqual(['$eq', '$ne']);
    expect(schema.definitions.conditionWithArrayValue.properties.operator.enum).toEqual(['$in', '$notIn']);
    expect(schema.definitions.conditionWithoutValue.properties.operator.enum).toEqual(['$empty', '$notEmpty']);
    expect(schema.definitions.conditionGroup.properties.logic.enum).toEqual(JS_TEMPLATE_SETTINGS_CONDITION_LOGICS);
    expect(schema.definitions.conditionGroup.properties.items.maxItems).toBe(
      JS_TEMPLATE_SETTINGS_CONDITION_LIMITS.maxItemsPerGroup,
    );
    expect(conditionRefs).toHaveLength(4);
    expect([
      ...schema.definitions.conditionWithValue.properties.operator.enum,
      ...schema.definitions.conditionWithArrayValue.properties.operator.enum,
      ...schema.definitions.conditionWithoutValue.properties.operator.enum,
    ]).toEqual(JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS);
  });

  it('rejects non-canonical fields, unsupported expressions, and malformed conditions', () => {
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
        $schema: JS_TEMPLATE_SCHEMA_URI,
      }),
    ).toBe(false);
    expect(
      validate({
        schemaVersion: 1,
        key: 'sales',
        settingsSchema: { type: 'object', properties: {} },
      }),
    ).toBe(false);
    expect(
      validate({
        schemaVersion: 1,
        key: 'sales',
        settings: {
          options: {
            type: 'object',
            additionalProperties: false,
          },
        },
      }),
    ).toBe(false);
    expect(
      validate({
        schemaVersion: 1,
        key: 'sales',
        settings: {
          options: {
            properties: { label: { type: 'string' } },
            $comment: JS_TEMPLATE_SETTINGS_INFERRED_OBJECT_COMMENT,
          },
        },
      }),
    ).toBe(false);
    expect(jsTemplateV1SchemaJson).not.toMatch(/meta\.json|settings\.json|"runjs"|\$not"/u);
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

  it('normalizes required flags and closes object schemas recursively through objects and array items', () => {
    const settings = {
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
      metadata: {
        properties: {
          region: { type: 'string' },
        },
      },
    };
    const settingsSchema = buildJsTemplateSettingsSchema(settings);

    expect(settingsSchema).toEqual({
      type: 'object',
      additionalProperties: false,
      required: ['mode'],
      properties: {
        mode: { type: 'string' },
        groups: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label'],
            properties: {
              label: { type: 'string' },
              options: {
                type: 'object',
                additionalProperties: false,
                required: ['enabled'],
                properties: {
                  enabled: { type: 'boolean' },
                },
              },
            },
          },
        },
        metadata: {
          type: 'object',
          $comment: JS_TEMPLATE_SETTINGS_INFERRED_OBJECT_COMMENT,
          additionalProperties: false,
          properties: {
            region: { type: 'string' },
          },
        },
      },
    });
    const validateSettings = ajv.compile(settingsSchema);
    expect(validateSettings({ mode: 'grid', groups: [], metadata: { region: 'APAC' } })).toBe(true);
    expect(validateSettings({ mode: 'grid', groups: [], metadata: 'APAC' })).toBe(false);
    expect(validateSettings({ mode: 'grid', groups: [], unknown: true })).toBe(false);
    expect(validateSettings({ mode: 'grid', groups: [], metadata: { region: 'APAC', unknown: true } })).toBe(false);
    expect(
      validateSettings({
        mode: 'grid',
        groups: [{ label: 'Group A', options: { enabled: true }, unknown: true }],
      }),
    ).toBe(false);
    expect(buildJsTemplateSettingsDefinition(settingsSchema)).toEqual(settings);
  });

  it('types required-only inferred object schemas and removes the derived annotation on roundtrip', () => {
    const settings = {
      metadata: {
        required: [],
      },
    };
    const settingsSchema = buildJsTemplateSettingsSchema(settings);

    expect(settingsSchema.properties).toEqual({
      metadata: {
        type: 'object',
        $comment: JS_TEMPLATE_SETTINGS_INFERRED_OBJECT_COMMENT,
        additionalProperties: false,
        required: [],
      },
    });
    const validateSettings = ajv.compile(settingsSchema);
    expect(validateSettings({ metadata: {} })).toBe(true);
    expect(validateSettings({ metadata: 'not-an-object' })).toBe(false);
    expect(buildJsTemplateSettingsDefinition(settingsSchema)).toEqual(settings);
  });
});
