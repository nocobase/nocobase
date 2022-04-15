import { isPg } from './utils';
import { Op } from 'sequelize';

export default {
  $includes(value, ctx) {
    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `%${value}%`,
    };
  },

  $notIncludes(value, ctx) {
    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `%${value}%`,
    };
  },

  $startsWith(value, ctx) {
    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `${value}%`,
    };
  },

  $notStartsWith(value, ctx) {
    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `${value}%`,
    };
  },

  $endWith(value, ctx) {
    return {
      [isPg(ctx) ? Op.iLike : Op.like]: `%${value}`,
    };
  },

  $notEndWith(value, ctx) {
    return {
      [isPg(ctx) ? Op.notILike : Op.notLike]: `%${value}`,
    };
  },
};
