import { Op } from 'sequelize';

export default {
  $isFalsy() {
    return {
      [Op.or]: {
        [Op.is]: null,
        [Op.eq]: false,
      },
    };
  },

  $isTruly() {
    return {
      [Op.eq]: true,
    };
  },
} as Record<string, any>;
