import moment from 'moment';

function parseUTC(value) {
  if (value.endsWith('Z')) {
    return {
      unit: 'utc',
      start: value,
    };
  }
}

function parseYear(value) {
  if (/^\d\d\d\d$/.test(value)) {
    return {
      unit: 'year',
      start: `${value}-01-01 00:00:00`,
    };
  }
}

function parseQuarter(value) {
  if (/^\d\d\d\d\Q\d$/.test(value)) {
    return {
      unit: 'quarter',
      start: moment(value, 'YYYY[Q]Q').format('YYYY-MM-DD HH:mm:ss'),
    };
  }
}

function parseWeek(value) {
  if (/^\d\d\d\d[W]\d\d$/.test(value)) {
    return {
      unit: 'isoWeek',
      start: moment(value, 'GGGG[W]W').format('YYYY-MM-DD HH:mm:ss'),
    };
  }
  if (/^\d\d\d\d[w]\d\d$/.test(value)) {
    return {
      unit: 'week',
      start: moment(value, 'gggg[w]w').format('YYYY-MM-DD HH:mm:ss'),
    };
  }
}

function parseMonth(value) {
  if (/^\d\d\d\d\-\d\d$/.test(value)) {
    return {
      unit: 'month',
      start: `${value}-01 00:00:00`,
    };
  }
}

function parseDay(value) {
  if (/^\d\d\d\d\-\d\d\-\d\d$/.test(value)) {
    return {
      unit: 'day',
      start: `${value} 00:00:00`,
    };
  }
}

function parseHour(value) {
  if (/^\d\d\d\d\-\d\d\-\d\d(\T|\s)\d\d$/.test(value)) {
    return {
      unit: 'hour',
      start: `${value}:00:00`,
    };
  }
}

function parseMinute(value) {
  if (/^\d\d\d\d\-\d\d\-\d\d(\T|\s)\d\d\:\d\d$/.test(value)) {
    return {
      unit: 'minute',
      start: `${value}:00`,
    };
  }
}

function parseSecond(value) {
  if (/^\d\d\d\d\-\d\d\-\d\d(\T|\s)\d\d\:\d\d\:\d\d$/.test(value)) {
    return {
      unit: 'second',
      start: `${value}`,
    };
  }
}

function parseMillisecond(value) {
  if (/^\d\d\d\d\-\d\d\-\d\d(\T|\s)\d\d\:\d\d\:\d\d\.\d\d\d$/.test(value)) {
    return {
      unit: 'millisecond',
      start: `${value}`,
    };
  }
}

const parsers = [
  parseUTC,
  parseYear,
  parseQuarter,
  parseWeek,
  parseMonth,
  parseDay,
  parseHour,
  parseMinute,
  parseSecond,
  parseMillisecond,
];

type ParseDateResult = {
  unit: any;
  start: string;
  timezone?: string;
};

function toISOString(m: moment.Moment) {
  return m.toISOString();
}

function dateRange(r: ParseDateResult) {
  if (!r.timezone) {
    r.timezone = '+00:00';
  }
  let m: moment.Moment;
  if (r.unit === 'utc') {
    return moment(r?.start).toISOString();
  } else {
    m = moment(`${r?.start}${r?.timezone}`);
  }
  m = m.utcOffset(r.timezone);
  return [m.startOf(r.unit), m.clone().add(1, r.unit).startOf(r.unit)].map(toISOString);
}

export function parseDate(value: any, options = {} as { timezone?: string }) {
  if (Array.isArray(value)) {
    return parseDateBetween(value, options);
  }
  const input = value;
  const match = /(.+)((\+|\-)\d\d\:\d\d)$/.exec(value);
  if (match) {
    value = match[1];
  }
  if (/^(\(|\[)/.test(value)) {
    return parseDateBetween(input, options);
  }
  for (const parse of parsers) {
    const r = parse(value);
    if (r) {
      r['input'] = input;
      if (match) {
        r['timezone'] = match[2];
      }
      if (!r['timezone']) {
        r['timezone'] = options.timezone || '+00:00';
      }
      return dateRange(r);
    }
  }
}

function parseDateBetween(value: any, options = {} as { timezone?: string }) {
  if (Array.isArray(value) && value.length > 1) {
    const [startValue, endValue, op = '[]', timezone] = value;
    const r0 = parseDate(startValue, { timezone });
    const r1 = parseDate(endValue, { timezone });
    const start = op.startsWith('(') ? r0[1] : r0[0];
    const end = op.endsWith(')') ? r1[0] : r1[1];
    return [start, end];
  }
  if (typeof value !== 'string') {
    return;
  }
  const match = /(.+)((\+|\-)\d\d\:\d\d)$/.exec(value);
  let timezone = options.timezone || '+00:00';
  if (match) {
    value = match[1];
    timezone = match[2];
  }
  const m = /^(\(|\[)(.+)\,(.+)(\)|\])$/.exec(value);
  if (!m) {
    return;
  }
  return parseDateBetween([m[2], m[3], `${m[1]}${m[4]}`, timezone]);
}
