import { getMultiFieldParsedValue, isArray, isMultiFieldParsedValue, parseDate } from '@nocobase/utils';
import { Op } from 'sequelize';

function isDate(input) {
  return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
}

const toDate = (date) => {
  if (isDate(date)) {
    return date;
  }
  return new Date(date);
};

const dateOn = (value, ctx) => {
  const r = parseDate(value, {
    timezone: ctx.db.options.timezone,
  });
  if (typeof r === 'string') {
    return {
      [Op.eq]: toDate(r),
    };
  }
  if (Array.isArray(r)) {
    return {
      [Op.and]: [{ [Op.gte]: toDate(r[0]) }, { [Op.lt]: toDate(r[1]) }],
    };
  }
  throw new Error(`Invalid Date ${JSON.stringify(value)}`);
};

const dateNotOn = (value, ctx) => {
  const r = parseDate(value, {
    timezone: ctx.db.options.timezone,
  });
  if (typeof r === 'string') {
    return {
      [Op.ne]: toDate(r),
    };
  }
  if (Array.isArray(r)) {
    return {
      [Op.or]: [{ [Op.lt]: toDate(r[0]) }, { [Op.gte]: toDate(r[1]) }],
    };
  }
  throw new Error(`Invalid Date ${JSON.stringify(value)}`);
};

const dateBefore = (value, ctx) => {
  const r = parseDate(value, {
    timezone: ctx.db.options.timezone,
  });
  if (typeof r === 'string') {
    return {
      [Op.lt]: toDate(r),
    };
  } else if (Array.isArray(r)) {
    return {
      [Op.lt]: toDate(r[0]),
    };
  }
  throw new Error(`Invalid Date ${JSON.stringify(value)}`);
};

const dateNotBefore = (value, ctx) => {
  const r = parseDate(value, {
    timezone: ctx.db.options.timezone,
  });
  if (typeof r === 'string') {
    return {
      [Op.gte]: toDate(r),
    };
  } else if (Array.isArray(r)) {
    return {
      [Op.gte]: toDate(r[0]),
    };
  }
  throw new Error(`Invalid Date ${JSON.stringify(value)}`);
};

const dateAfter = (value, ctx) => {
  const r = parseDate(value, {
    timezone: ctx.db.options.timezone,
  });
  if (typeof r === 'string') {
    return {
      [Op.gt]: toDate(r),
    };
  } else if (Array.isArray(r)) {
    return {
      [Op.gte]: toDate(r[1]),
    };
  }
  throw new Error(`Invalid Date ${JSON.stringify(value)}`);
};

const dateNotAfter = (value, ctx) => {
  const r = parseDate(value, {
    timezone: ctx.db.options.timezone,
  });
  if (typeof r === 'string') {
    return {
      [Op.lte]: toDate(r),
    };
  } else if (Array.isArray(r)) {
    return {
      [Op.lt]: toDate(r[1]),
    };
  }
  throw new Error(`Invalid Date ${JSON.stringify(value)}`);
};

export default {
  $dateOn(value, ctx) {
    if (isMultiFieldParsedValue(value)) {
      value = getMultiFieldParsedValue(value);
      if (isArray(value)) {
        return {
          [Op.or]: value.map((v) => dateOn(v, ctx)),
        };
      }
    }
    return dateOn(value, ctx);
  },

  $dateNotOn(value, ctx) {
    if (isMultiFieldParsedValue(value)) {
      value = getMultiFieldParsedValue(value);
      if (isArray(value)) {
        return {
          [Op.and]: value.map((v) => dateNotOn(v, ctx)),
        };
      }
    }
    return dateNotOn(value, ctx);
  },

  $dateBefore(value, ctx) {
    if (isMultiFieldParsedValue(value)) {
      value = getMultiFieldParsedValue(value);
      if (isArray(value)) {
        return {
          [Op.and]: value.map((v) => dateBefore(v, ctx)),
        };
      }
    }
    return dateBefore(value, ctx);
  },

  $dateNotBefore(value, ctx) {
    if (isMultiFieldParsedValue(value)) {
      value = getMultiFieldParsedValue(value);
      if (isArray(value)) {
        return {
          [Op.and]: value.map((v) => dateNotBefore(v, ctx)),
        };
      }
    }
    return dateNotBefore(value, ctx);
  },

  $dateAfter(value, ctx) {
    if (isMultiFieldParsedValue(value)) {
      value = getMultiFieldParsedValue(value);
      if (isArray(value)) {
        return {
          [Op.and]: value.map((v) => dateAfter(v, ctx)),
        };
      }
    }
    return dateAfter(value, ctx);
  },

  $dateNotAfter(value, ctx) {
    if (isMultiFieldParsedValue(value)) {
      value = getMultiFieldParsedValue(value);
      if (isArray(value)) {
        return {
          [Op.and]: value.map((v) => dateNotAfter(v, ctx)),
        };
      }
    }
    return dateNotAfter(value, ctx);
  },

  $dateBetween(value, ctx) {
    const r = parseDate(value, {
      timezone: ctx.db.options.timezone,
    });
    if (r) {
      return {
        [Op.and]: [{ [Op.gte]: toDate(r[0]) }, { [Op.lt]: toDate(r[1]) }],
      };
    }
    throw new Error(`Invalid Date ${JSON.stringify(value)}`);
  },
} as Record<string, any>;
