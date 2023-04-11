import { Op } from 'sequelize';

export default {
  $ne(val, ctx) {
    if (Array.isArray(val)) {
      return {
        [Op.notIn]: val,
      };
    }
    return val === null
      ? {
          [Op.ne]: null,
        }
      : {
          [Op.or]: {
            [Op.ne]: val,
            [Op.is]: null,
          },
        };
  },
} as Record<string, any>;
