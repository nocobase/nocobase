import { Op } from 'sequelize';
import { isPg } from './utils';

function escapeLike(value: string) {
  return value.replace(/[_%]/g, '\\$&');
}

export default {
  $includes(value, ctx) {
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
