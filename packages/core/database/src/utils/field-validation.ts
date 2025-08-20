/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi, { AnySchema, Root } from 'joi';
import { ValidationOptions } from '../fields';
import _ from 'lodash';

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
      if (!_.isEmpty(rule.args)) {
        if (rule.name === 'pattern' && !_.isRegExp(rule.args.regex)) {
          const lastSlash = rule.args.regex.lastIndexOf('/');
          const isRegExpStr = rule.args.regex.startsWith('/') && lastSlash > 0;
          if (isRegExpStr) {
            rule.args.regex = rule.args.regex.slice(1, lastSlash);
          }
          rule.args.regex = new RegExp(rule.args.regex);
        }
        schema =
          rule.paramsType === 'object' ? schema[rule.name](rule.args) : schema[rule.name](...Object.values(rule.args));
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
export function getJoiErrorMessage(t: Function) {
  const tOptions = { ns: 'client' };
  const JoiErrorMessages = {
    'string.base': t('{{#label}} must be a string', tOptions),
    'string.empty': t('{{#label}} is not allowed to be empty', tOptions),
    'string.min': t('{{#label}} length must be at least {{#limit}} characters long', tOptions),
    'string.max': t('{{#label}} length must be less than or equal to {{#limit}} characters long', tOptions),
    'string.length': t('{{#label}} length must be {{#limit}} characters long', tOptions),
    'string.alphanum': t('{{#label}} must only contain alpha-numeric characters', tOptions),
    'string.token': t('{{#label}} must only contain alpha-numeric and underscore characters', tOptions),
    'string.regex': t('{{#label}} with value {{#value}} fails to match the required pattern', tOptions),
    'string.email': t('{{#label}} email address doesn’t meet the required format', tOptions),
    'string.uri': t('{{#label}} must be a valid uri', tOptions),
    'string.uriCustomScheme': t(
      '{{#label}} must be a valid uri with a scheme matching the {{#scheme}} pattern',
      tOptions,
    ),
    'string.isoDate': t('{{#label}} must be a valid ISO 8601 date', tOptions),
    'string.guid': t('{{#label}} must be a valid UUID', tOptions),
    'string.hex': t('{{#label}} must only contain hexadecimal characters', tOptions),
    'string.hostname': t('{{#label}} must be a valid hostname', tOptions),
    'string.lowercase': t('{{#label}} must only contain lowercase characters', tOptions),
    'string.uppercase': t('{{#label}} must only contain uppercase characters', tOptions),
    'string.trim': t('{{#label}} must not have leading or trailing whitespace', tOptions),
    'string.creditCard': t('{{#label}} must be a credit card', tOptions),
    'string.pattern.base': t('{{#label}} with value "{{#value}}" fails to match the required pattern', tOptions),
    'string.pattern.name': t('{{#label}} with value "{{#value}}" fails to match the {{#name}} pattern', tOptions),
    'string.pattern.invert.base': t('{{#label}} with value "{{#value}}" matches the inverted pattern', tOptions),
    'string.pattern.invert.name': t(
      '{{#label}} with value "{{#value}}" matches the inverted {{#name}} pattern',
      tOptions,
    ),

    'any.required': t('{{#label}} is required', tOptions),
    'number.base': t('{{#label}} must be a number', tOptions),
    'number.min': t('{{#label}} must be greater than or equal to {{#limit}}', tOptions),
    'number.max': t('{{#label}} must be less than or equal to {{#limit}}', tOptions),
    'number.less': t('{{#label}} must be less than {{#limit}}', tOptions),
    'number.greater': t('{{#label}} must be greater than {{#limit}}', tOptions),
    'number.float': t('{{#label}} must be a float or double', tOptions),
    'number.integer': t('{{#label}} must be an integer', tOptions),
    'number.negative': t('{{#label}} must be a negative number', tOptions),
    'number.positive': t('{{#label}} must be a positive number', tOptions),
    'number.precision': t('{{#label}} must not have more than {{#limit}} decimal places', tOptions),
    'number.multiple': t('{{#label}} must be a multiple of {{#multiple}}', tOptions),
    'number.port': t('{{#label}} must be a valid port', tOptions),
    'number.unsafe': t('{{#label}} must be a safe number', tOptions),

    'date.base': t('{{#label}} must be a valid date', tOptions),
    'date.format': t('{{#label}} must be in {{#format}} format', tOptions),
    'date.greater': t('{{#label}} must be greater than {{#limit}}', tOptions),
    'date.less': t('{{#label}} must be less than {{#limit}}', tOptions),
    'date.max': t('{{#label}} must be less than or equal to {{#limit}}', tOptions),
    'date.min': t('{{#label}} must be greater than or equal to {{#limit}}', tOptions),
  };
  return JoiErrorMessages;
}
