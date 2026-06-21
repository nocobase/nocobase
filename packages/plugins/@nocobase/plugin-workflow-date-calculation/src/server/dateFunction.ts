import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

import { isDate } from '..';

dayjs.extend(duration);
dayjs.extend(quarterOfYear);

const methodsMap = {
  year: 'asYears',
  month: 'asMonths',
  week: 'asWeeks',
  day: 'asDays',
  hour: 'asHours',
  minute: 'asMinutes',
  second: 'asSeconds',
  millisecond: 'asMilliseconds',
};
const getMethodsMap = {
  year: 'year',
  month: 'month',
  quarter: 'quarter',
  week: 'day',
  day: 'date',
  hour: 'hour',
  minute: 'minute',
  second: 'second',
  millisecond: 'millisecond',
};
const transDurationMethodsMap = {
  year: 'years',
  month: 'months',
  week: 'weeks',
  day: 'days',
  hour: 'hours',
  minute: 'minutes',
  second: 'seconds',
  millisecond: 'milliseconds',
};
const startOfTimeMethodsMap = {
  year: 'year',
  quarter: 'quarter',
  month: 'month',
  week: 'isoWeek',
  day: 'day',
  hour: 'hour',
  minute: 'minute',
  second: 'second',
  millisecond: 'millisecond',
};
const endOfTimeMethodsMap = {
  year: 'year',
  quarter: 'quarter',
  month: 'month',
  week: 'isoWeek',
  day: 'day',
  hour: 'hour',
  minute: 'minute',
  second: 'second',
  millisecond: 'millisecond',
};
const timestampUnitFnsMap = {
  second: 'unix',
  millisecond: 'valueOf',
};

export const functions = {
  add(input, args) {
    const { number, unit } = args;
    return input.add(number, unit);
  },
  subtract(input, args) {
    const { number, unit } = args;
    return input.subtract(number, unit);
  },
  diff(input, args) {
    const { date, unit, isAbs, round } = args;

    if (!isDate(date)) {
      throw new Error(`Diff date [${date}] is not a valid date`);
    }

    const diffDay = dayjs(date);
    let diff = input.diff(diffDay, unit, true);

    if (isAbs) {
      diff = Math.abs(diff);
    }

    if (round === -1) {
      diff = Math.floor(diff);
    } else if (round === 0) {
      diff = Math.round(diff);
    } else if (round === 1) {
      diff = Math.ceil(diff);
    }

    return diff;
  },
  get(input, args) {
    const { unit } = args;
    const method = getMethodsMap[unit];

    if (!method) {
      return input.millisecond();
    }

    if (input[method]) {
      const result = input[method]();
      return unit === 'month' ? result + 1 : result;
    }

    return input;
  },
  startOfTime(input, args) {
    const { unit } = args;

    return input.startOf(startOfTimeMethodsMap[unit]);
  },
  endOfTime(input, args) {
    const { unit } = args;

    return input.endOf(endOfTimeMethodsMap[unit]);
  },
  isLeapYear(input, args) {
    return input.isLeapYear();
  },
  format(input, args) {
    const { format } = args;

    if (typeof format !== 'string') {
      throw new TypeError(`[${format}] is not a string`);
    }

    return input.format(format);
  },
  transDuration(input, args) {
    const { unitBefore, unitAfter, round } = args;

    if (!transDurationMethodsMap[unitBefore]) {
      throw new TypeError(`[${unitBefore}] is not a unit string`);
    }
    if (!methodsMap[unitAfter]) {
      throw new TypeError(`[${unitAfter}] is not a unit string`);
    }

    const duration = dayjs.duration(input, transDurationMethodsMap[unitBefore]);
    let result = duration[methodsMap[unitAfter]]();

    if (round === -1) {
      result = Math.floor(result);
    } else if (round === 0) {
      result = Math.round(result);
    } else if (round === 1) {
      result = Math.ceil(result);
    }

    return result;
  },
  toTimestamp(input, args) {
    const { unit = 'second' } = args;

    const method = timestampUnitFnsMap[unit];
    if (!method) {
      throw new TypeError(`[${unit}] is not valid, only accept second or millisecond`);
    }

    return input[method]();
  },
  tsToDate(input, args) {
    const { unit = 'second' } = args;
    if (!['second', 'millisecond'].includes(unit)) {
      throw new TypeError(`[${unit}] is not valid, only accept second or millisecond`);
    }

    return unit === 'second' ? dayjs.unix(input) : dayjs(input);
  },
  changeTimezone(input, args) {
    const { timezone } = args;
    return input.tz(timezone);
  },
};
