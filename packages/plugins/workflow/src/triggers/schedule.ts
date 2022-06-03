import parser from 'cron-parser';
import { literal, Op } from 'sequelize';
import { Trigger } from '.';

export type ScheduleOnField = string | {
  field: string;
  // in seconds
  offset?: number;
  unit?: 1000 | 60000 | 3600000 | 86400000;
};
export interface ScheduleTriggerConfig {
  // trigger mode
  mode: number;
  // how to repeat
  repeat?: string | number | null;
  // limit of repeat times
  limit?: number;

  startsOn?: ScheduleOnField;
  endsOn?: ScheduleOnField;
}

export const SCHEDULE_MODE = {
  CONSTANT: 0,
  COLLECTION_FIELD: 1
} as const;

interface ScheduleMode {
  on?(this: ScheduleTrigger, workflow): void;
  off?(this: ScheduleTrigger, workflow): void;
  shouldCache(this: ScheduleTrigger, workflow, now: Date): Promise<boolean> | boolean;
  trigger(this: ScheduleTrigger, workflow, now: Date): any;
}

const ScheduleModes = new Map<number, ScheduleMode>();

ScheduleModes.set(SCHEDULE_MODE.CONSTANT, {
  shouldCache(workflow, now) {
    const { startsOn, endsOn, repeat } = workflow.config;
    const timestamp = now.getTime();
    if (startsOn) {
      const startTime = Date.parse(startsOn);
      if (!startTime || (startTime > timestamp + this.cacheCycle)) {
        return false;
      }
      if (typeof repeat === 'number'
        && repeat > this.cacheCycle
        && (timestamp - startTime) % repeat > this.cacheCycle
      ) {
        return false;
      }
    }
    if (endsOn) {
      const endTime = Date.parse(endsOn);
      if (!endTime || endTime <= timestamp) {
        return false;
      }
    }

    return true;
  },
  trigger(workflow, date) {
    const { startsOn, endsOn, repeat } = workflow.config;
    if (startsOn && typeof repeat === 'number') {
      const startTime = Date.parse(startsOn);
      if ((startTime - date.getTime()) % repeat) {
        return;
      }
    }
    return workflow.trigger({ date });
  }
});

function getDateRangeFilter(on: ScheduleOnField, now: Date, dir: number) {
  const timestamp = now.getTime();
  const op = dir < 0 ? Op.lt : Op.gte;
  switch (typeof on) {
    case 'string':
      const time = Date.parse(on);
      if (!time || (dir < 0 ? (timestamp < time) : (time <= timestamp))) {
        return null;
      }
      break;
    case 'object':
      const { field, offset = 0, unit = 1000 } = on;
      return { [field]: { [op]: new Date(timestamp + offset * unit * dir) } };
    default:
      break;
  }

  return {};
}

function getDataOptionTime(data, on, dir = 1) {
  switch (typeof on) {
    case 'string':
      const time = Date.parse(on);
      return time ? time : null;
    case 'object':
      const { field, offset = 0, unit = 1000 } = on;
      return data[field] ? data[field].getTime() - offset * unit * dir : null;
    default:
      return null;
  }
}

function getHookId(workflow, type) {
  return `${type}#${workflow.id}`;
}

const DialectTimestampFnMap: { [key: string]: Function } = {
  postgres(col) {
    return `extract(epoch from "${col}")`;
  },
  mysql(col) {
    return `UNIX_TIMESTAMP(${col})`;
  },
  sqlite(col) {
    return `unixepoch(${col})`;
  }
};
DialectTimestampFnMap.mariadb = DialectTimestampFnMap.mysql;

ScheduleModes.set(SCHEDULE_MODE.COLLECTION_FIELD, {
  on(workflow) {
    const { collection, startsOn, endsOn, repeat } = workflow.config;
    const event = `${collection}.afterSave`;
    const name = getHookId(workflow, event);
    if (!this.events.has(name)) {
      // NOTE: toggle cache depends on new date
      const listener = async (data, options) => {
        // check if saved collection data in cache cycle
        //   in: add workflow to cache
        //   out: 1. do nothing because if any other data in
        //        2. another way is always check all data to match cycle
        //           by calling: inspect(workflow)
        //           this may lead to performance issues
        //        so we can only check single row and only set in if true
        // how to check?
        // * startsOn only      : startsOn in cycle
        // * endsOn only        : invalid
        // * repeat only          : invalid
        // * startsOn and endsOn: equal to only startsOn
        // * startsOn and repeat  : startsOn in cycle and repeat in cycle
        // * endsOn and repeat    : invalid
        // * all                : all rules effect
        // * none               : invalid
        // this means, startsOn and repeat should be present at least one
        // and no startsOn equals run on repeat, and could ends on endsOn,
        // this will be a little wired, only means the end date should use collection field.
        const now = new Date();
        now.setMilliseconds(0);
        const timestamp = now.getTime();
        const startTime = getDataOptionTime(data, startsOn);
        const endTime = getDataOptionTime(data, endsOn, -1);
        if (!startTime && !repeat) {
          return;
        }
        if (startTime && startTime > timestamp + this.cacheCycle) {
          return;
        }
        if (endTime && endTime <= timestamp) {
          return;
        }
        if (!nextInCycle.call(this, workflow, now)) {
          return;
        }
        if (typeof repeat === 'number'
          && repeat > this.cacheCycle
          && (timestamp - startTime) % repeat > this.cacheCycle
        ) {
          return;
        }
        console.log('set cache', now);

        this.setCache(workflow);
      };
      this.events.set(name, listener);
      this.db.on(`${collection}.afterSave`, listener);
    }
  },

  off(workflow) {
    const { collection } = workflow.config;
    const event = `${collection}.afterSave`;
    const name = getHookId(workflow, event);
    if (this.events.has(name)) {
      const listener = this.events.get(name);
      this.events.delete(name);
      this.db.off(`${collection}.afterSave`, listener);
    }
  },

  async shouldCache(workflow, now) {
    const { startsOn, endsOn, repeat, collection } = workflow.config;
    const starts = getDateRangeFilter(startsOn, now, -1);
    if (!starts || !Object.keys(starts).length) {
      return false;
    }
    const ends = getDateRangeFilter(endsOn, now, 1);
    if (!ends) {
      return false;
    }

    const conditions: any[] = [starts, ends].filter(item => Boolean(Object.keys(item).length));
    // when repeat is number, means repeat after startsOn
    // (now - startsOn) % repeat <= cacheCycle
    const tsFn = DialectTimestampFnMap[this.db.options.dialect];
    if (repeat
      && typeof repeat === 'number'
      && repeat > this.cacheCycle
      && tsFn
    ) {
      const uts = now.getTime();
      conditions.push(literal(`mod(${uts} - ${tsFn(startsOn.field)} * 1000, ${repeat}) < ${this.cacheCycle}`));
    }

    const { model } = this.db.getCollection(collection);
    const count = await model.count({
      where: { [Op.and]: conditions }
    });

    return Boolean(count);
  },

  async trigger(workflow, date) {
    const {
      collection,
      startsOn,
      endsOn,
      repeat
    } = workflow.config;

    if (typeof startsOn !== 'object') {
      return;
    }

    const timestamp = date.getTime();
    const startTimestamp = timestamp - (startsOn.offset ?? 0) * (startsOn.unit ?? 1000);

    const conditions = [];
    if (!repeat) {
      // startsOn exactly equal to now in 1s
      conditions.push({
        [startsOn.field]: {
          [Op.gte]: new Date(startTimestamp),
          [Op.lt]: new Date(startTimestamp + 1000)
        }
      });
    } else {
      // startsOn not after now
      conditions.push({
        [startsOn.field]: {
          [Op.lt]: new Date(startTimestamp)
        }
      });

      const tsFn = DialectTimestampFnMap[this.db.options.dialect];
      if (typeof repeat === 'number' && tsFn) {
        const uts = timestamp;
        conditions.push(literal(`mod(${uts} - floor(${tsFn(startsOn.field)}) * 1000, ${repeat}) = 0`));
      }

      switch (typeof endsOn) {
        case 'string':
          const endTime = Date.parse(endsOn);
          if (!endTime || endTime <= timestamp) {
            return;
          }
          break;
        case 'object':
          conditions.push({
            [endsOn.field]: {
              [Op.gte]: new Date(timestamp - (endsOn.offset ?? 0) * (endsOn.unit ?? 1000) + 1000)
            }
          });
          break;
        default:
          break;
      }
    }

    const { model } = this.db.getCollection(collection);
    const instances = await model.findAll({
      where: {
        [Op.and]: conditions
      }
    });

    if (instances.length) {
      console.log(instances.length, 'rows trigger at', date);
    }

    instances.forEach(item => {
      workflow.trigger({
        date,
        data: item.get()
      });
    });
  }
});


function nextInCycle(this: ScheduleTrigger, workflow, now: Date): boolean {
  const { repeat } = workflow.config;
  // no repeat means no need to rerun
  // but if in current cycle, should be put in cache
  // no repeat but in current cycle means startsOn has been configured
  // so we need to more info to determine if necessary config items
  if (!repeat) {
    return true;
  }

  switch (typeof repeat) {
    case 'string':
      break;
    default:
      return true;
  }

  const currentDate = new Date(now);
  currentDate.setMilliseconds(-1);
  const timestamp = now.getTime();
  const interval = parser.parseExpression(repeat, { currentDate });
  let next = interval.next();

  // NOTE: cache all workflows will be matched in current cycle
  if (next.getTime() - timestamp <= this.cacheCycle) {
    return true;
  }

  return false;
}
export default class ScheduleTrigger implements Trigger {
  static CacheRules = [
    // ({ enabled }) => enabled,
    ({ config, executed }) => config.limit ? executed < config.limit : true,
    ({ config }) => ['repeat', 'startsOn'].some(key => config[key]),
    nextInCycle,
    function(workflow, now) {
      const { mode } = workflow.config;
      const modeHandlers = ScheduleModes.get(mode);
      return modeHandlers.shouldCache.call(this, workflow, now);
    }
  ];

  static TriggerRules = [
    ({ config, executed }) => config.limit ? executed < config.limit : true,
    ({ config }) => ['repeat', 'startsOn'].some(key => config[key]),
    function (workflow, now) {
      const { repeat } = workflow.config;
      if (typeof repeat !== 'string') {
        return true;
      }

      const currentDate = new Date(now);
      currentDate.setMilliseconds(-1);
      const timestamp = now.getTime();
      const interval = parser.parseExpression(repeat, { currentDate });
      let next = interval.next();

      if (next.getTime() === timestamp) {
        return true;
      }

      return false;
    }
  ];

  public readonly db;

  events = new Map();

  private timer: NodeJS.Timeout = null;

  private cache: Map<number | string, any> = new Map();

  // running interval, default to 1s
  interval: number = 1_000;
  // caching workflows in range, default to 1min
  cacheCycle: number = 60_000;

  constructor({ app }) {
    this.db = app.db;

    app.on('beforeStop', () => {
      if (this.timer) {
        clearInterval(this.timer);
      }
    });
  }

  init() {
    if (!this.timer) {
      const now = new Date();

      // NOTE: assign to this.timer to avoid duplicated initialization
      this.timer = setTimeout(
        () => {
          this.timer = setInterval(this.run, this.interval);

          // initially trigger
          // this.onTick(now);

        },
        // NOTE:
        //  try to align to system time on each second starts,
        //  after at least 1 second initialized for anything to get ready.
        //  so jobs in 2 seconds will be missed at first start.
        1_000 - now.getMilliseconds()
      );
    }
  }

  run = () => {
    const now = new Date();
    now.setMilliseconds(0);

    // NOTE: trigger `onTick` for high interval jobs which are cached in last 1 min
    this.onTick(now);

    // NOTE: reload when second match cache cycle
    if (!(now.getTime() % this.cacheCycle)) {
      this.reload();
    }
  };

  async onTick(now) {
    // NOTE: trigger workflows in sequence when sqlite due to only one transaction
    const isSqlite = this.db.options.dialect === 'sqlite';

    return Array.from(this.cache.values()).reduce((prev, workflow) => {
      if (!this.shouldTrigger(workflow, now)) {
        return prev;
      }
      if (isSqlite) {
        return prev.then(() => this.trigger(workflow, now));
      }
      this.trigger(workflow, now);
      return null;
    }, isSqlite ? Promise.resolve() : null);
  }

  async reload() {
    const WorkflowModel = this.db.getCollection('workflows').model;
    const workflows = await WorkflowModel.findAll({
      where: { enabled: true, type: 'schedule' },
      include: [
        {
          association: 'executions',
          attributes: ['id', 'createdAt'],
          seperate: true,
          limit: 1,
          order: [['createdAt', 'DESC']],
        }
      ],
      group: ['id'],
    });

    // NOTE: clear cached jobs in last cycle
    this.cache = new Map();

    this.inspect(workflows);
  }

  inspect(workflows) {
    const now = new Date();
    now.setMilliseconds(0);

    workflows.forEach(async (workflow) => {
      const should = await this.shouldCache(workflow, now);

      this.setCache(workflow, !should);
    });
  }

  setCache(workflow, out = false) {
    out
      ? this.cache.delete(workflow.id)
      : this.cache.set(workflow.id, workflow);
  }

  async shouldCache(workflow, now) {
    for await (const rule of (<typeof ScheduleTrigger>this.constructor).CacheRules) {
      if (!(await rule.call(this, workflow, now))) {
        return false;
      }
    }
    return true;
  }

  shouldTrigger(workflow, now): boolean {
    for (const rule of (<typeof ScheduleTrigger>this.constructor).TriggerRules) {
      if (!rule.call(this, workflow, now)) {
        return false;
      }
    }
    return true;
  }

  async trigger(workflow, date: Date) {
    const { mode } = workflow.config;
    const modeHandlers = ScheduleModes.get(mode);
    return modeHandlers.trigger.call(this, workflow, date);
  }

  on(workflow) {
    // NOTE: lazy initialization
    this.init();

    const { mode } = workflow.config;
    const modeHandlers = ScheduleModes.get(mode);
    if (modeHandlers && modeHandlers.on) {
      modeHandlers.on.call(this, workflow);
    }
    this.inspect([workflow]);
  }
  off(workflow) {
    const { mode } = workflow.config;
    const modeHandlers = ScheduleModes.get(mode);
    if (modeHandlers && modeHandlers.off) {
      modeHandlers.off.call(this, workflow);
    }
    this.cache.delete(workflow.id);
  }
}
