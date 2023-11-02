import { Op } from 'sequelize';
import { isPg } from './utils';

export default {
  $includes(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.iLike : Op.like]: `%${item}%`,
      }));

      return {
        [Op.or]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `%${value}%`,
    };
  },

  $notIncludes(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.notILike : Op.notLike]: `%${item}%`,
      }));

      return {
        [Op.and]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `%${value}%`,
    };
  },

  $startsWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.iLike : Op.like]: `${item}%`,
      }));

      return {
        [Op.or]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `${value}%`,
    };
  },

  $notStartsWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.notILike : Op.notLike]: `${item}%`,
      }));

      return {
        [Op.and]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `${value}%`,
    };
  },

  $endWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.iLike : Op.like]: `%${item}`,
      }));

      return {
        [Op.or]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `%${value}`,
    };
  },

  $notEndWith(value, ctx) {
    if (Array.isArray(value)) {
      const conditions = value.map((item) => ({
        [isPg(ctx) ? Op.notILike : Op.notLike]: `%${item}`,
      }));

      return {
        [Op.and]: conditions,
      };
    }

    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `%${value}`,
    };
  },
} as Record<string, any>;
