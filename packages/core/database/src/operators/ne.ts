import { Op } from 'sequelize';

export default {
  $ne(val, ctx) {
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
};
