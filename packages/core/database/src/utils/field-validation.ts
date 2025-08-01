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

export function buildJoiSchema(validation: ValidationOptions): AnySchema {
  const { type, rules } = validation;

  if (!type || typeof type !== 'string' || !(type in Joi)) {
    throw new Error(`Invalid validation type: "${type}". Type must be a valid Joi schema type.`);
  }

  let schema = Joi[type]();

  if (rules) {
    rules.forEach((rule) => {
      if (!_.isEmpty(rule.args)) {
        schema = schema[rule.name](...Object.values(rule.args));
      } else {
        schema = schema[rule.name]();
      }
    });
  }

  return schema;
}
