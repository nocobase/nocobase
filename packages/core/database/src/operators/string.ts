import { isArray } from '@nocobase/utils';
import { Op } from 'sequelize';
import { isPg } from './utils';

export default {
  $includes(value, ctx) {
    if (isArray(value)) {
      return {
        [Op.or]: value.map((v) => ({
          [isPg(ctx) ? Op.iLike : Op.like]: `%${v}%`,
        })),
      };
    }
    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `%${value}%`,
    };
  },

  $notIncludes(value, ctx) {
    if (isArray(value)) {
      return {
        [Op.and]: value.map((v) => ({
          [isPg(ctx) ? Op.notILike : Op.notLike]: `%${v}%`,
        })),
      };
    }
    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `%${value}%`,
    };
  },

  $startsWith(value, ctx) {
    if (isArray(value)) {
      return {
        [Op.or]: value.map((v) => ({
          [isPg(ctx) ? Op.iLike : Op.like]: `${v}%`,
        })),
      };
    }
    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `${value}%`,
    };
  },

  $notStartsWith(value, ctx) {
    if (isArray(value)) {
      return {
        [Op.and]: value.map((v) => ({
          [isPg(ctx) ? Op.notILike : Op.notLike]: `${v}%`,
        })),
      };
    }
    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `${value}%`,
    };
  },

  $endWith(value, ctx) {
    if (isArray(value)) {
      return {
        [Op.or]: value.map((v) => ({
          [isPg(ctx) ? Op.iLike : Op.like]: `%${v}`,
        })),
      };
    }
    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `%${value}`,
    };
  },

  $notEndWith(value, ctx) {
    if (isArray(value)) {
      return {
        [Op.and]: value.map((v) => ({
          [isPg(ctx) ? Op.notILike : Op.notLike]: `%${v}`,
        })),
      };
    }
    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `%${value}`,
    };
  },
} as Record<
  string,
  (
    value: any,
    ctx: any,
  ) => {
    [x: symbol]: string;
  }
>;
