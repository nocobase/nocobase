/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseDate } from '@nocobase/utils';
import { Op, Sequelize } from 'sequelize';
import moment from 'moment';

/**
 * 自动识别时间是否为 UTC，统一输出为本地时间格式字符串
 * @param val - 原始时间字符串或 Date 对象
 * @param format - 输出格式，默认 'YYYY-MM-DD HH:mm:ss'
 */
function formatAsLocalTime(val: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const m = moment(val);

  // 判断是否为 ISO UTC 格式，例如 2025-07-20T00:00:00Z 或含有 Z、+00:00 后缀
  const isLikelyUTC = typeof val === 'string' && /Z$|[+-]00:00$/.test(val);

  // 若 moment 对象是 UTC 或原始字符串看起来是 UTC，就转本地
  return m.isUTC() || isLikelyUTC ? m.local().format(format) : m.format(format);
}

function isDate(input) {
  return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

const toDate = (date, options: any = {}) => {
  const { ctx } = options;
  let val = isDate(date) ? date : new Date(date);
  const field = ctx.db.getFieldByPath(ctx.fieldPath);

  if (!field) {
    return val;
  }

  if (field.constructor.name === 'UnixTimestampField') {
    val = field.dateToValue(val);
  }

  if (field.constructor.name === 'DatetimeNoTzField') {
    val = moment(val).utcOffset('+00:00').format('YYYY-MM-DD HH:mm:ss');
  }

  if (field.constructor.name === 'DateOnlyField') {
    val = formatAsLocalTime(val);
  }

  const eventObj = {
    val,
    fieldType: field.type,
  };

  ctx.db.emit('filterToDate', eventObj);

  return eventObj.val;
};

function parseDateTimezone(ctx) {
  const field = ctx.db.getFieldByPath(ctx.fieldPath);

  if (!field) {
    return ctx.db.options.timezone;
  }

  if (field.constructor.name === 'DatetimeNoTzField') {
    return '+00:00';
  }

  if (field.constructor.name === 'DateOnlyField') {
    return '+00:00';
  }

  return ctx.db.options.timezone;
}

export default {
  $dateOn(value, ctx) {
    const r = parseDate(value, {
      timezone: parseDateTimezone(ctx),
    });
    if (typeof r === 'string') {
      return {
        [Op.eq]: toDate(r, { ctx }),
      };
    }

    if (Array.isArray(r)) {
      console.log(11111111, {
        [Op.and]: [{ [Op.gte]: toDate(r[0], { ctx }) }, { [Op.lt]: toDate(r[1], { ctx }) }],
      });
      return {
        [Op.and]: [{ [Op.gte]: toDate(r[0], { ctx }) }, { [Op.lt]: toDate(r[1], { ctx }) }],
      };
    }

    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateNotOn(value, ctx) {
    const r = parseDate(value, {
      timezone: parseDateTimezone(ctx),
    });
    if (typeof r === 'string') {
      return {
        [Op.ne]: toDate(r, { ctx }),
      };
    }
    if (Array.isArray(r)) {
      return {
        [Op.or]: [{ [Op.lt]: toDate(r[0], { ctx }) }, { [Op.gte]: toDate(r[1], { ctx }) }],
      };
    }

    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateBefore(value, ctx) {
    const r = parseDate(value, {
      timezone: parseDateTimezone(ctx),
    });

    if (typeof r === 'string') {
      return {
        [Op.lt]: toDate(r, { ctx }),
      };
    } else if (Array.isArray(r)) {
      return {
        [Op.lt]: toDate(r[0], { ctx }),
      };
    }

    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateNotBefore(value, ctx) {
    const r = parseDate(value, {
      timezone: parseDateTimezone(ctx),
    });
    if (typeof r === 'string') {
      return {
        [Op.gte]: toDate(r, { ctx }),
      };
    } else if (Array.isArray(r)) {
      return {
        [Op.gte]: toDate(r[0], { ctx }),
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateAfter(value, ctx) {
    const r = parseDate(value, {
      timezone: parseDateTimezone(ctx),
    });
    if (typeof r === 'string') {
      return {
        [Op.gt]: toDate(r, { ctx }),
      };
    } else if (Array.isArray(r)) {
      return {
        [Op.gte]: toDate(r[1], { ctx }),
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateNotAfter(value, ctx) {
    const r = parseDate(value, {
      timezone: parseDateTimezone(ctx),
    });
    if (typeof r === 'string') {
      return {
        [Op.lte]: toDate(r, { ctx }),
      };
    } else if (Array.isArray(r)) {
      return {
        [Op.lt]: toDate(r[1], { ctx }),
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateBetween(value, ctx) {
    const r = parseDate(value, {
      timezone: parseDateTimezone(ctx),
    });
    if (r) {
      return {
        [Op.and]: [{ [Op.gte]: toDate(r[0], { ctx }) }, { [Op.lt]: toDate(r[1], { ctx }) }],
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },
} as Record<string, any>;
