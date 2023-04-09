import { getMultiFieldParsedValue, isMultiFieldParsedValue } from '@nocobase/utils';
import { Op } from 'sequelize';

export default {
  $notIn(val, ctx) {
    if (isMultiFieldParsedValue(val)) {
      val = getMultiFieldParsedValue(val);
    }
    return {
      [Op.or]: {
        [Op.notIn]: val,
        [Op.is]: null,
      },
    };
  },
} as Record<string, any>;
