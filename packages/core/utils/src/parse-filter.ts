import get from 'lodash/get';
import set from 'lodash/set';
import moment from 'moment';

const re = /^\s*\{\{([\s\S]*)\}\}\s*$/;

function isBuffer(obj) {
  return obj && obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
}

function keyIdentity(key) {
  return key;
}

function flatten(target, opts?: any) {
  opts = opts || {};

  const delimiter = opts.delimiter || '.';
  const maxDepth = opts.maxDepth;
  const transformKey = opts.transformKey || keyIdentity;
  const transformValue = opts.transformValue || keyIdentity;
  const output = {};

  function step(object, prev?: any, currentDepth?: any) {
    currentDepth = currentDepth || 1;
    Object.keys(object).forEach(function (key) {
      const value = object[key];
      const isarray = opts.safe && Array.isArray(value);
      const type = Object.prototype.toString.call(value);
      const isbuffer = isBuffer(value);
      const isobject = type === '[object Object]' || type === '[object Array]';

      const newKey = prev ? prev + delimiter + transformKey(key) : transformKey(key);

      if (opts.breakOn({ key })) {
        output[newKey] = transformValue(value, newKey);
        return;
      }

      if (
        !isarray &&
        !isbuffer &&
        isobject &&
        Object.keys(value).length &&
        (!opts.maxDepth || currentDepth < maxDepth)
      ) {
        return step(value, newKey, currentDepth + 1);
      }

      output[newKey] = transformValue(value, newKey);
    });
  }

  step(target);

  return output;
}

function unflatten(obj, opts: any = {}) {
  const parsed = {};
  const transformValue = opts.transformValue || keyIdentity;
  Object.keys(obj).forEach((key) => {
    set(parsed, key, transformValue(obj[key], key));
  });
  return parsed;
}

function isNumeric(str: any) {
  if (typeof str === 'number') return true;
  if (typeof str != 'string') return false;
  return !isNaN(str as any) && !isNaN(parseFloat(str));
}

const parsePath = (path: string) => {
  let operator = path.split('.').pop() || '';
  if (!operator.startsWith('$')) {
    operator = '';
  }
  return { operator };
};

const isDateOperator = (op) => {
  return [
    '$dateOn',
    '$dateNotOn',
    '$dateBefore',
    '$dateAfter',
    '$dateNotBefore',
    '$dateNotAfter',
    '$dateBetween',
  ].includes(op);
};

const dateValueWrapper = (value: string, timezone?: string) => {
  return value;
  if (!value) {
    return null;
  }
  if (!timezone || /(\+|\-)\d\d\:\d\d$/.test(value)) {
    return value;
  }
  return value + timezone;
};

export type ParseFilterOptions = {
  vars?: Record<string, any>;
  timezone?: string;
};

export const parseFilter = async (filter: any, opts: ParseFilterOptions = {}) => {
  const userFieldsSet = new Set();
  const vars = opts.vars || {};
  const timezone = opts.timezone;

  const flat = flatten(filter, {
    breakOn({ key }) {
      return key.startsWith('$') && key !== '$and' && key !== '$or';
    },
    transformValue(value) {
      if (typeof value !== 'string') {
        return value;
      }
      // parse user fields parameter
      const match = re.exec(value);
      if (match) {
        const key = match[1].trim();
        if (key.startsWith('$user')) {
          userFieldsSet.add(key.substring(6));
        }
      }
      return value;
    },
  });

  if (userFieldsSet.size > 0) {
    const $user = await vars.$user({ fields: [...userFieldsSet.values()] });
    Object.assign(vars, { $user });
  }

  return unflatten(flat, {
    transformValue(value, path) {
      const { operator } = parsePath(path);
      // parse string variables
      if (typeof value === 'string') {
        const match = re.exec(value);
        if (match) {
          const key = match[1].trim();
          const val = get(vars, key, null);
          value = typeof val === 'function' ? val?.({ operator, timezone }) : val;
        }
      }
      if (isDateOperator(operator)) {
        return dateValueWrapper(value, timezone);
      }
      return value;
    },
  });
};

export function getDateOperatorVariables(m: moment.Moment, unitOfTime) {
  return {
    $dateBetween: () => [m.startOf(unitOfTime).toISOString(), m.endOf(unitOfTime).toISOString()],
    $dateBefore: () => m.startOf(unitOfTime).toISOString(),
    $dateAfter: () => m.endOf(unitOfTime).toISOString(),
    $dateNotBefore: () => m.startOf(unitOfTime).toISOString(),
    $dateNotAfter: () => m.endOf(unitOfTime).toISOString(),
  };
}

export function getDateVariable({ timezone, unitOfTime, offset = 0, operator }) {
  let m = moment();
  if (timezone) {
    m = m.utcOffset(timezone);
  }
  if (offset > 0) {
    m = m.add(offset, unitOfTime);
  } else if (offset < 0) {
    m = m.subtract(-1 * offset, unitOfTime);
  }
  const fn = getDateOperatorVariables(m, unitOfTime)[operator];
  return fn?.();
}

export function getLastDays({ timezone, amount }) {
  let m = moment().utcOffset(timezone);
  return [m.subtract(amount, 'days').startOf('day').toISOString(), m.subtract(1, 'day').endOf('day').toISOString()];
}

export function getNextDays({ timezone, amount }) {
  let m = moment().utcOffset(timezone);
  return [m.add(1, 'day').startOf('day').toISOString(), m.add(amount, 'days').endOf('day').toISOString()];
}

// const a = {
//   a: 'a',
//   b: 'b',
//   c: { $eq: 'a' },
//   d: { $notIn: ['a', 'b', 'c'] },
//   'e.a.$dateOn': '2023-03-24+08:00',
//   'e.b.$dateOn': '2023-03-24-08:00',
//   'e.f.$dateOn': '2023-03-24',
//   'e.f.$dateBefore': '{{$date.today}}',
//   'e.e.$dateBefore': '{{$date.tomorrow}}',
//   $and: [{ 'a.b': '{{ $user.id}}' }, { a: '{{$user.id }}' }],
//   $or: [
//     {
//       $and: [{ a: '{{$user.id}}' }, { a: '{{ $user.id }}' }],
//     },
//   ],
// };

// parseFilter(a, {
//   timezone: '+08:00',
//   vars: {
//     $date: {
//       today: () => moment().toISOString(),
//     },
//     async $user() {
//       return {
//         id: 1,
//       };
//     },
//   },
// }).then((data) => {
//   console.log(data);
// });
