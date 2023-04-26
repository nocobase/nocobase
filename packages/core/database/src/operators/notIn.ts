import { Op } from 'sequelize';

export default {
  $notIn(val, ctx) {
    return {
      [Op.or]: {
        [Op.notIn]: val,
        [Op.is]: null,
      },
    };
  },
} as Record<string, any>;
