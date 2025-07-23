/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from 'sequelize';
import { ArrayField, StringField } from '../fields';
import arrayOperators from './array';
import lodash, { parseInt } from 'lodash';

const findFilterFieldType = (ctx) => {
  const db = ctx.db;

  const path = ctx.path.split('.');

  // remove operators
  path.pop();

  const fieldName = path.pop();

  let model = ctx.model;

  const associationPath = path;

  for (const association of associationPath) {
    if (lodash.isFinite(parseInt(association)) || association.startsWith('$')) {
      continue;
    }

    const modelAssociation = model.associations[association];
    if (!modelAssociation) {
      break;
    }
    model = modelAssociation.target;
  }

  const collection = db.modelCollection.get(model);

  return collection.getField(fieldName);
};

export default {
  $empty(_, ctx) {
    const field = findFilterFieldType(ctx);

    if (field instanceof StringField) {
      return {
        [Op.or]: {
          [Op.is]: null,
          [Op.eq]: '',
        },
      };
    }

    if (field instanceof ArrayField) {
      return arrayOperators.$arrayEmpty(_, ctx);
    }

    return {
      [Op.is]: null,
    };
  },

  $notEmpty(_, ctx) {
    const field = findFilterFieldType(ctx);

    if (field instanceof StringField) {
      return {
        [Op.and]: {
          [Op.not]: null,
          [Op.ne]: '',
        },
      };
    }

    if (field instanceof ArrayField) {
      return arrayOperators.$arrayNotEmpty(_, ctx);
    }

    return {
      [Op.not]: null,
    };
  },
} as Record<string, any>;
