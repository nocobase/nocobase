import { parseDate } from '@nocobase/utils';
import { Op } from 'sequelize';

export default {
  $dateOn(value, ctx) {
    const r = parseDate(value, {
      timezone: ctx.db.options.timezone,
    });
    if (typeof r === 'string') {
      return {
        [Op.eq]: r,
      };
    }
    if (Array.isArray(r)) {
      return {
        [Op.and]: [{ [Op.gte]: r[0] }, { [Op.lt]: r[1] }],
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateNotOn(value, ctx) {
    const r = parseDate(value, {
      timezone: ctx.db.options.timezone,
    });
    if (typeof r === 'string') {
      return {
        [Op.ne]: r,
      };
    }
    if (Array.isArray(r)) {
      return {
        [Op.or]: [{ [Op.lt]: r[0] }, { [Op.gte]: r[1] }],
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateBefore(value, ctx) {
    const r = parseDate(value, {
      timezone: ctx.db.options.timezone,
    });
    if (typeof r === 'string') {
      return {
        [Op.lt]: r,
      };
    } else if (Array.isArray(r)) {
      return {
        [Op.lt]: r[0],
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateNotBefore(value, ctx) {
    const r = parseDate(value, {
      timezone: ctx.db.options.timezone,
    });
    if (typeof r === 'string') {
      return {
        [Op.gte]: r,
      };
    } else if (Array.isArray(r)) {
      return {
        [Op.gte]: r[0],
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateAfter(value, ctx) {
    const r = parseDate(value, {
      timezone: ctx.db.options.timezone,
    });
    if (typeof r === 'string') {
      return {
        [Op.gt]: r,
      };
    } else if (Array.isArray(r)) {
      return {
        [Op.gte]: r[1],
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateNotAfter(value, ctx) {
    const r = parseDate(value, {
      timezone: ctx.db.options.timezone,
    });
    if (typeof r === 'string') {
      return {
        [Op.lte]: r,
      };
    } else if (Array.isArray(r)) {
      return {
        [Op.lt]: r[1],
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },

  $dateBetween(value, ctx) {
    const r = parseDate(value, {
      timezone: ctx.db.options.timezone,
    });
    if (r) {
      return {
        [Op.and]: [{ [Op.gte]: r[0] }, { [Op.lt]: r[1] }],
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },
} as Record<string, any>;
