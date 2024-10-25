/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from 'sequelize';
import { isPg } from './utils';

function escapeLike(value: string) {
  return value.replace(/[_%]/g, '\\$&');
}

export default {
  $includes(value, ctx) {
    if (value === null) {
      return {
        [Op.is]: null,
      };
    }
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.iLike : Op.like]: `%${escapeLike(item)}%`,
      }));

      return {
        [Op.or]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `%${escapeLike(value)}%`,
    };
  },

  $notIncludes(value, ctx) {
    if (value === null) {
      return {
        [Op.not]: null,
      };
    }
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.notILike : Op.notLike]: `%${escapeLike(item)}%`,
      }));

      return {
        [Op.and]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `%${escapeLike(value)}%`,
    };
  },

  $startsWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.iLike : Op.like]: `${escapeLike(item)}%`,
      }));

      return {
        [Op.or]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `${escapeLike(value)}%`,
    };
  },

  $notStartsWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.notILike : Op.notLike]: `${escapeLike(item)}%`,
      }));

      return {
        [Op.and]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `${escapeLike(value)}%`,
    };
  },

  $endWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.iLike : Op.like]: `%${escapeLike(item)}`,
      }));

      return {
        [Op.or]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `%${escapeLike(value)}`,
    };
  },

  $notEndWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.notILike : Op.notLike]: `%${escapeLike(item)}`,
      }));

      return {
        [Op.and]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `%${escapeLike(value)}`,
    };
  },
} as Record<string, any>;
