/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi, { AnySchema } from 'joi';
import { ValidationOptions } from '../fields';
import _ from 'lodash';

function getFractionLength(value: string) {
  const normalized = value.trim().replace(/,/g, '');
  if (!normalized || /e/i.test(normalized)) {
    return 0;
  }

  const unsignedValue = normalized.startsWith('+') || normalized.startsWith('-') ? normalized.slice(1) : normalized;
  const dotIndex = unsignedValue.indexOf('.');

  if (dotIndex < 0) {
    return 0;
  }

  return unsignedValue.slice(dotIndex + 1).length;
}

export function buildJoiSchema(validation: ValidationOptions, options: { label?: string; value: string }): AnySchema {
  const { type, rules } = validation;
  const { label, value } = options;

  if (!type || typeof type !== 'string' || !(type in Joi)) {
    throw new Error(`Invalid validation type: "${type}". Type must be a valid Joi schema type.`);
  }

  let schema = Joi[type]();

  const isRequired = rules.some((rule) => rule.name === 'required');

  if (isRequired) {
    schema = schema.empty(null);
  } else {
    schema = schema.allow(null, '');
    if ([null, ''].includes(value)) return schema;
  }

  if (rules) {
    rules.forEach((rule) => {
      const args = _.cloneDeep(rule.args);
      if (rule.name === 'precision') {
        const limit = Number(args?.limit);
        schema = schema.custom((currentValue, helpers) => {
          if (Number.isNaN(limit)) {
            return currentValue;
          }

          const originalValue = helpers.original;
          if (originalValue === null || originalValue === undefined || originalValue === '') {
            return currentValue;
          }

          if (getFractionLength(String(originalValue)) > limit) {
            return helpers.error('number.precision', { limit });
          }

          return currentValue;
        });
        return;
      }
      if (!_.isEmpty(args)) {
        if (rule.name === 'pattern' && !_.isRegExp(args.regex)) {
          const lastSlash = args.regex.lastIndexOf('/');
          const isRegExpStr = args.regex.startsWith('/') && lastSlash > 0;
          if (isRegExpStr) {
            args.regex = args.regex.slice(1, lastSlash);
          }
          args.regex = new RegExp(args.regex);
        }
        schema = rule.paramsType === 'object' ? schema[rule.name](args) : schema[rule.name](...Object.values(args));
      } else {
        schema = schema[rule.name]();
      }
    });
  }

  if (label) {
    schema = schema.label(label);
  }

  return schema;
}
