import moment, { MomentInput } from 'moment';
import { Op } from 'sequelize';
function stringToDate(value: string): Date {
  return moment(value).toDate();
}

function getNextDay(value: MomentInput): Date {
  return moment(value).add(1, 'd').toDate();
}

export default {
  $dateOn(value, ctx) {
    // const field = ctx.db.getFieldByPath(ctx.fieldPath);
    // console.log(field.isDateOnly());
    return {
      [Op.and]: [{ [Op.gte]: stringToDate(value) }, { [Op.lt]: getNextDay(value) }],
    };
  },

  $dateNotOn(value) {
    return {
      [Op.or]: [{ [Op.lt]: stringToDate(value) }, { [Op.gte]: getNextDay(value) }],
    };
  },

  $dateBefore(value) {
    return { [Op.lt]: stringToDate(value) };
  },

  $dateNotBefore(value) {
    return {
      [Op.gte]: stringToDate(value),
    };
  },

  $dateAfter(value) {
    return { [Op.gte]: getNextDay(value) };
  },

  $dateNotAfter(value) {
    return { [Op.lt]: getNextDay(value) };
  },
} as Record<string, any>;
