/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Ajv2020 from 'ajv/dist/2020';

import {
  LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
  LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
  LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION,
  LIGHT_EXTENSION_SETTINGS_CONDITION_LIMITS,
  LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS,
  LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS,
  LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS,
  LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES,
  LIGHT_EXTENSION_X_COMPONENT_WHITELIST,
  lightExtensionEntryV1Schema,
  lightExtensionEntryV1SchemaJson,
} from '../schema';

describe('@nocobase/light-extension-sdk entry.json schema', () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(lightExtensionEntryV1Schema);

  it('passes draft 2020-12 meta-validation and validates the canonical example', () => {
    expect(ajv.validateSchema(lightExtensionEntryV1Schema)).toBe(true);
    expect(validate(lightExtensionEntryV1Schema.examples[0])).toBe(true);
  });

  it('locks canonical constants to the schema', () => {
    const schema = lightExtensionEntryV1Schema;
    const settingsSchema = schema.$defs.settingsSchema;
    const conditionRefs = schema.$defs.condition.oneOf.map((item) => item.$ref);

    expect(schema.$id).toBe(LIGHT_EXTENSION_ENTRY_SCHEMA_URI);
    expect(schema.properties.schemaVersion.const).toBe(LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION);
    expect(schema.properties.key.pattern).toBe(LIGHT_EXTENSION_ENTRY_KEY_PATTERN);
    expect(settingsSchema.properties.type.enum).toEqual(LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES);
    expect(Object.keys(settingsSchema.properties)).toEqual(LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS);
    expect(settingsSchema.properties['x-component'].enum).toEqual(LIGHT_EXTENSION_X_COMPONENT_WHITELIST);
    expect(schema.$defs.conditionWithValue.properties.operator.enum).toEqual(['$eq', '$ne']);
    expect(schema.$defs.conditionWithArrayValue.properties.operator.enum).toEqual(['$in', '$notIn']);
    expect(schema.$defs.conditionWithoutValue.properties.operator.enum).toEqual(['$empty', '$notEmpty']);
    expect(schema.$defs.conditionGroup.properties.logic.enum).toEqual(LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS);
    expect(schema.$defs.conditionGroup.properties.items.maxItems).toBe(
      LIGHT_EXTENSION_SETTINGS_CONDITION_LIMITS.maxItemsPerGroup,
    );
    expect(conditionRefs).toHaveLength(4);
    expect([
      ...schema.$defs.conditionWithValue.properties.operator.enum,
      ...schema.$defs.conditionWithArrayValue.properties.operator.enum,
      ...schema.$defs.conditionWithoutValue.properties.operator.enum,
    ]).toEqual(LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS);
  });

  it('rejects legacy fields, old kinds of expressions, and malformed conditions', () => {
    expect(validate({ schemaVersion: 1, key: 'sales', meta: {} })).toBe(false);
    expect(
      validate({
        schemaVersion: 1,
        key: 'sales',
        settingsSchema: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              'x-visible-when': { path: 'enabled', operator: '$contains', value: true },
            },
          },
        },
      }),
    ).toBe(false);
    expect(lightExtensionEntryV1SchemaJson).not.toMatch(/meta\.json|settings\.json|"runjs"|\$not"/u);
  });
});
