/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from 'sequelize';

export default {
  $eq(val: any, ctx) {
    if (ctx?.fieldPath) {
      const field = ctx.db.getFieldByPath(ctx.fieldPath);
      if (field?.type === 'string' && typeof val !== 'string') {
        return {
          [Op.eq]: String(val),
        };
      }
    }
    if (Array.isArray(val)) {
      return {
        [Op.in]: val,
      };
    }
    return {
      [Op.eq]: val,
    };
  },
} as Record<string, any>;
