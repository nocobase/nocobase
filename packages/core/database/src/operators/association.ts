import { Op, Sequelize } from 'sequelize';

export default {
  $exists(value, ctx) {
    return {
      [Op.not]: null,
    };
  },
  $notExists(value, ctx) {
    return {
      [Op.is]: null,
    };
  },
} as Record<string, any>;
