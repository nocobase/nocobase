/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension settings condition validator', () => {
  it('accepts all v1 operators, empty groups, and object-only nested paths', () => {
    const result = validateSettings({
      type: 'object',
      properties: {
        mode: { type: 'integer', default: 1 },
        enabled: { type: 'boolean', default: true },
        display: {
          type: 'object',
          properties: {
            title: { type: 'string', default: 'Sales' },
          },
        },
        eqField: conditional({ path: 'mode', operator: '$eq', value: 1 }),
        neField: conditional({ path: 'mode', operator: '$ne', value: 2 }),
        inField: conditional({ path: 'display.title', operator: '$in', value: ['Sales', 'Orders'] }),
        notInField: conditional({ path: 'mode', operator: '$notIn', value: [2, 3] }),
        emptyField: conditional({ path: 'display.title', operator: '$empty' }),
        notEmptyField: conditional({ path: 'enabled', operator: '$notEmpty' }),
        emptyAnd: conditional({ logic: '$and', items: [] }),
        emptyOr: conditional({ logic: '$or', items: [] }),
      },
    });

    expect(result.accepted).toBe(true);
    expect(result.diagnostics).toEqual([]);
  });

  it.each([
    [{ path: 'mode', operator: '$contains', value: 1 }, 'settings_condition_operator_not_allowed'],
    [{ path: 'mode', operator: '$in', value: 1 }, 'settings_condition_value_invalid'],
    [{ path: 'mode', operator: '$empty', value: null }, 'settings_condition_value_invalid'],
    [{ path: 'missing', operator: '$eq', value: 1 }, 'settings_condition_path_not_found'],
    [{ path: 'items.name', operator: '$eq', value: 'x' }, 'settings_condition_path_not_found'],
    [{ path: '__proto__.polluted', operator: '$eq', value: true }, 'settings_condition_path_unsafe'],
    [{ path: 'mode', operator: '$eq', value: '{{ ctx.user }}' }, 'settings_condition_value_invalid'],
    [{ path: 'mode', operator: '$eq', value: { constructor: { polluted: true } } }, 'settings_condition_value_invalid'],
  ])('rejects invalid condition %j with %s', (condition, expectedCode) => {
    const result = validateSettings(baseSchema(condition));

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: expectedCode,
        path: 'src/client/js-blocks/sales/entry.json',
        details: expect.objectContaining({ schemaPath: expect.stringContaining('x-visible-when') }),
      }),
    );
  });

  it('rejects direct, subtree, two-node, and multi-node visibility cycles', () => {
    const result = validateSettings({
      type: 'object',
      properties: {
        direct: conditional({ path: 'direct', operator: '$notEmpty' }),
        display: {
          type: 'object',
          'x-visible-when': { path: 'display.child', operator: '$notEmpty' },
          properties: { child: { type: 'string' } },
        },
        alpha: conditional({ path: 'beta', operator: '$notEmpty' }),
        beta: conditional({ path: 'alpha', operator: '$notEmpty' }),
        one: conditional({ path: 'two', operator: '$notEmpty' }),
        two: conditional({ path: 'three', operator: '$notEmpty' }),
        three: conditional({ path: 'one', operator: '$notEmpty' }),
      },
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics.filter((item) => item.code === 'settings_condition_cycle').length).toBeGreaterThanOrEqual(
      7,
    );
  });

  it('enforces depth, node, group item, and path segment limits', () => {
    const tooDeep = nestedCondition(9);
    const tooManyNodes = {
      logic: '$and',
      items: Array.from({ length: 32 }, () => ({
        logic: '$or',
        items: [
          { path: 'mode', operator: '$eq', value: 1 },
          { path: 'mode', operator: '$ne', value: 2 },
        ],
      })),
    };
    const tooManyItems = {
      logic: '$and',
      items: Array.from({ length: 33 }, () => ({ path: 'mode', operator: '$eq', value: 1 })),
    };
    const tooManySegments = {
      path: Array.from({ length: 17 }, () => 'nested').join('.'),
      operator: '$eq',
      value: 1,
    };

    for (const condition of [tooDeep, tooManyNodes, tooManyItems, tooManySegments]) {
      const result = validateSettings(baseSchema(condition));
      expect(result.accepted).toBe(false);
      expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'settings_condition_too_complex' }));
    }
  });

  it('rejects conditions anywhere inside an array item subtree', () => {
    const result = validateSettings({
      type: 'object',
      properties: {
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
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'settings_condition_invalid' }));
  });

  it('rejects duplicate required names and oversized component props', () => {
    const result = validateLegacySettingsSchema({
      type: 'object',
      required: ['title', 'title'],
      properties: {
        title: {
          type: 'string',
          'x-component': 'Input',
          'x-component-props': Object.fromEntries(Array.from({ length: 65 }, (_, index) => [`prop${index}`, index])),
        },
      },
    });

    expect(result.accepted).toBe(false);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'settings_required_invalid' }),
        expect.objectContaining({ code: 'settings_field_invalid' }),
      ]),
    );
  });

  it('requires a complete schema-valid default for required conditional properties', () => {
    const missing = validateSettings(
      requiredConditional({
        type: 'string',
        'x-visible-when': { path: 'enabled', operator: '$eq', value: true },
      }),
    );
    const wrongType = validateSettings(
      requiredConditional({
        type: 'integer',
        default: '1',
        'x-visible-when': { path: 'enabled', operator: '$eq', value: true },
      }),
    );
    const incompleteObject = validateSettings(
      requiredConditional({
        type: 'object',
        properties: { title: { type: 'string', required: true } },
        default: {},
        'x-visible-when': { path: 'enabled', operator: '$eq', value: true },
      }),
    );
    const unknownObjectProperty = validateSettings(
      requiredConditional({
        type: 'object',
        properties: { title: { type: 'string', required: true } },
        default: { title: 'Sales', extra: true },
        'x-visible-when': { path: 'enabled', operator: '$eq', value: true },
      }),
    );
    const invalidFormat = validateSettings(
      requiredConditional({
        type: 'string',
        format: 'email',
        default: 'not-an-email',
        'x-visible-when': { path: 'enabled', operator: '$eq', value: true },
      }),
    );
    const inferredIncompleteObject = validateSettings(
      requiredConditional({
        properties: { title: { type: 'string', required: true } },
        default: {},
        'x-visible-when': { path: 'enabled', operator: '$eq', value: true },
      }),
    );
    const valid = validateSettings(
      requiredConditional({
        type: 'object',
        properties: { title: { type: 'string', required: true } },
        default: { title: 'Sales' },
        'x-visible-when': { path: 'enabled', operator: '$eq', value: true },
      }),
    );

    for (const result of [
      missing,
      wrongType,
      incompleteObject,
      unknownObjectProperty,
      invalidFormat,
      inferredIncompleteObject,
    ]) {
      expect(result.accepted).toBe(false);
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({ code: 'settings_condition_required_default_missing' }),
      );
    }
    expect(valid.accepted).toBe(true);
  });
});

function validateSettings(settingsSchema: Record<string, unknown>) {
  const properties = settingsSchema.properties;
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    throw new Error('Expected a root object schema with properties');
  }
  return validateDescriptorSettings({ settings: properties });
}

function validateLegacySettingsSchema(settingsSchema: Record<string, unknown>) {
  return validateDescriptorSettings({ settingsSchema });
}

function validateDescriptorSettings(descriptorSettings: Record<string, unknown>) {
  return new LightExtensionValidator().validateWorkspace({
    files: [
      { path: 'src/client/js-blocks/sales/index.tsx', content: 'ctx.render(null);\n' },
      {
        path: 'src/client/js-blocks/sales/entry.json',
        content: JSON.stringify({ schemaVersion: 1, key: 'sales', ...descriptorSettings }),
      },
    ],
  });
}

function conditional(condition: unknown) {
  return { type: 'string', 'x-visible-when': condition };
}

function baseSchema(condition: unknown) {
  return {
    type: 'object',
    properties: {
      mode: { type: 'integer' },
      items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
      target: conditional(condition),
    },
  };
}

function nestedCondition(depth: number): unknown {
  if (depth <= 1) {
    return { path: 'mode', operator: '$eq', value: 1 };
  }
  return { logic: '$and', items: [nestedCondition(depth - 1)] };
}

function requiredConditional(propertySchema: Record<string, unknown>) {
  return {
    type: 'object',
    properties: {
      enabled: { type: 'boolean', default: true },
      target: { ...propertySchema, required: true },
    },
  };
}
