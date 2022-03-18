import { Op } from 'sequelize';

export default {
  $ne(val, ctx) {
    return {
      [Op.or]: {
        [Op.ne]: val,
        [Op.is]: null,
      },
    };
  },
};
