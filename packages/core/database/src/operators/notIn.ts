import { getValueFromJsonata, isFromJsonata } from '@nocobase/utils';
import { Op } from 'sequelize';

export default {
  $notIn(val, ctx) {
    if (isFromJsonata(val)) {
      val = getValueFromJsonata(val);
    }
    return {
      [Op.or]: {
        [Op.notIn]: val,
        [Op.is]: null,
      },
    };
  },
} as Record<string, any>;
