/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';

export function jioToJoiSchema<T extends 'string' | 'number' | 'array' | 'boolean' | 'any'>(jioConfig: {
  type: T;
  rules?: any[];
}): T extends 'string'
  ? Joi.StringSchema
  : T extends 'number'
    ? Joi.NumberSchema
    : T extends 'array'
      ? Joi.ArraySchema
      : T extends 'boolean'
        ? Joi.BooleanSchema
        : Joi.AnySchema {
  let schema: any;

  switch (jioConfig.type) {
    case 'string':
      schema = Joi.string();
      break;
    case 'number':
      schema = Joi.number();
      break;
    case 'array':
      schema = Joi.array();
      break;
    case 'boolean':
      schema = Joi.boolean();
      break;
    default:
      schema = Joi.any();
  }

  if (jioConfig.rules) {
    for (const rule of jioConfig.rules) {
      const { name, args } = rule;
      switch (name) {
        case 'min':
          schema = schema.min(args.limit);
          break;
        case 'max':
          schema = schema.max(args.limit);
          break;
        case 'required':
          schema = schema.required();
          break;
        case 'pattern':
          schema = schema.pattern(new RegExp(args.regex));
          break;
        case 'email':
          schema = schema.email({ tlds: { allow: false } });
          break;
      }
    }
  }

  return schema;
}
