import { Op } from 'sequelize';

export default {
  $eq(val: any) {
    if (Array.isArray(val)) {
      return {
        [Op.in]: val,
      };
    }
    return {
      [Op.eq]: val,
    };
  },
} as Record<string, any>;
