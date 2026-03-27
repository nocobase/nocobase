/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type { ISchema } from '@formily/json-schema';
import type { FlowDynamicHint, FlowJsonSchema, FlowSchemaCoverage } from '../types';
import { createFlowHint } from './utils';

export type StepSchemaResolution = {
  schema?: FlowJsonSchema;
  hints: FlowDynamicHint[];
  coverage: FlowSchemaCoverage['status'];
};

export type UiSchemaLike =
  | Record<string, ISchema>
  | ((...args: any[]) => Record<string, ISchema> | Promise<Record<string, ISchema>>)
  | undefined;

function inferSchemaFromUiSchemaValue(
  name: string,
  uiSchema: ISchema,
  path: string,
  hints: FlowDynamicHint[],
): FlowJsonSchema {
  if (!uiSchema || typeof uiSchema !== 'object' || Array.isArray(uiSchema)) {
    return { type: 'object', additionalProperties: true };
  }

  const xComponent = (uiSchema as any)['x-component'];
  if (typeof xComponent === 'function') {
    hints.push(
      createFlowHint(
        {
          kind: 'custom-component',
          path,
          message: `${name} uses a custom component and needs manual schema review.`,
        },
        {
          unresolvedReason: 'function-x-component',
          recommendedFallback: { type: 'object', additionalProperties: true },
        },
      ),
    );
  }

  const reactions = (uiSchema as any)['x-reactions'];
  if (
    reactions &&
    ((Array.isArray(reactions) && reactions.some((item) => typeof item === 'function')) ||
      typeof reactions === 'function')
  ) {
    hints.push(
      createFlowHint(
        {
          kind: 'x-reactions',
          path,
          message: `${name} contains function-based x-reactions and only static schema is generated.`,
        },
        {
          unresolvedReason: 'function-x-reactions',
        },
      ),
    );
  }

  const schema: FlowJsonSchema = {};
  const type = (uiSchema as any).type;
  if (type) {
    schema.type = type;
  }
  if ((uiSchema as any).description) {
    schema.description = (uiSchema as any).description;
  }
  if ((uiSchema as any).default !== undefined) {
    schema.default = _.cloneDeep((uiSchema as any).default);
  }
  if ((uiSchema as any).enum) {
    if (
      Array.isArray((uiSchema as any).enum) &&
      (uiSchema as any).enum.every((item) => _.isPlainObject(item) && 'value' in item)
    ) {
      schema.enum = (uiSchema as any).enum.map((item) => item.value);
    } else {
      schema.enum = _.cloneDeep((uiSchema as any).enum);
    }
  }
  if ((uiSchema as any).const !== undefined) {
    schema.const = _.cloneDeep((uiSchema as any).const);
  }
  if ((uiSchema as any).required === true) {
    schema.__required = true;
  }

  const validator = (uiSchema as any)['x-validator'];
  if (_.isPlainObject(validator)) {
    if (validator.minimum !== undefined) schema.minimum = validator.minimum;
    if (validator.maximum !== undefined) schema.maximum = validator.maximum;
    if (validator.minLength !== undefined) schema.minLength = validator.minLength;
    if (validator.maxLength !== undefined) schema.maxLength = validator.maxLength;
    if (validator.pattern !== undefined) schema.pattern = validator.pattern;
  } else if (Array.isArray(validator)) {
    for (const item of validator) {
      if (_.isPlainObject(item)) {
        Object.assign(schema, _.pick(item, ['minimum', 'maximum', 'minLength', 'maxLength', 'pattern']));
      }
    }
  } else if (typeof validator === 'string') {
    if (validator === 'integer') schema.type = 'integer';
    if (validator === 'email') schema.format = 'email';
    if (validator === 'url') schema.format = 'uri';
    if (validator === 'uid') schema.pattern = '^[A-Za-z0-9_-]+$';
  }

  if ((uiSchema as any).properties && _.isPlainObject((uiSchema as any).properties)) {
    schema.type = schema.type || 'object';
    schema.properties = {};
    const required: string[] = [];
    for (const [propName, propValue] of Object.entries((uiSchema as any).properties)) {
      const childSchema = inferSchemaFromUiSchemaValue(propName, propValue as ISchema, `${path}.${propName}`, hints);
      if ((childSchema as any).__required) {
        required.push(propName);
        delete (childSchema as any).__required;
      }
      (schema.properties as any)[propName] = childSchema;
    }
    if (required.length) {
      schema.required = required;
    }
    schema.additionalProperties = false;
  }

  if ((uiSchema as any).items) {
    schema.type = schema.type || 'array';
    if (_.isPlainObject((uiSchema as any).items)) {
      schema.items = inferSchemaFromUiSchemaValue(`${name}.items`, (uiSchema as any).items, `${path}.items`, hints);
    } else if (Array.isArray((uiSchema as any).items)) {
      schema.items = (uiSchema as any).items.map((item, index) =>
        inferSchemaFromUiSchemaValue(`${name}.items[${index}]`, item, `${path}.items[${index}]`, hints),
      );
    }
  }

  if (!schema.type) {
    schema.type = 'object';
    schema.additionalProperties = true;
  }

  return schema;
}

export function inferParamsSchemaFromUiSchema(
  name: string,
  uiSchema: UiSchemaLike,
  path: string,
): StepSchemaResolution {
  const hints: FlowDynamicHint[] = [];
  if (!uiSchema) {
    return { schema: undefined, hints, coverage: 'unresolved' };
  }

  if (typeof uiSchema === 'function') {
    hints.push(
      createFlowHint(
        {
          kind: 'dynamic-ui-schema',
          path,
          message: `${name} uses function-based uiSchema and requires manual schema patch.`,
        },
        {
          unresolvedReason: 'function-ui-schema',
          recommendedFallback: { type: 'object', additionalProperties: true },
        },
      ),
    );
    return {
      schema: { type: 'object', additionalProperties: true },
      hints,
      coverage: 'unresolved',
    };
  }

  const properties: Record<string, FlowJsonSchema> = {};
  const required: string[] = [];
  for (const [key, value] of Object.entries(uiSchema)) {
    const childSchema = inferSchemaFromUiSchemaValue(key, value, `${path}.${key}`, hints);
    if ((childSchema as any).__required) {
      required.push(key);
      delete (childSchema as any).__required;
    }
    properties[key] = childSchema;
  }

  return {
    schema: {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: false,
    },
    hints,
    coverage: hints.length ? 'mixed' : 'auto',
  };
}
