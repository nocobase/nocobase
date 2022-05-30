import parser from 'cron-parser';
import { merge } from 'lodash';
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
  cron?: string;
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
    const { startsOn, endsOn } = workflow.config;
    const timestamp = now.getTime();
    if (startsOn) {
      const startTime = Date.parse(startsOn);
      if (!startTime || (startTime > timestamp + this.cacheCycle)) {
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
    return workflow.trigger({ date });
  }
});

function getDateRangeFilter(on, now: Date, op = '$gte', range = 0) {
  const timestamp = now.getTime();
  const dir = op === '$gte' ? 1 : -1;
  switch (typeof on) {
    case 'string':
      const time = Date.parse(on);
      if (!time || (op === '$gte' ? (time < timestamp) : (time > timestamp + range))) {
        return null;
      }
      break;
    case 'object':
      const { field, offset = 0, unit = 1000 } = on;
      return { [field]: { [op]: new Date(timestamp - offset * unit * dir) } };
    default:
      break;
  }

  return {};
}

function getDataOptionTime(data, on, now: Date, dir = 1) {
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

ScheduleModes.set(SCHEDULE_MODE.COLLECTION_FIELD, {
  on(workflow) {
    const { collection, startsOn, endsOn, cron } = workflow.config;
    const event = `${collection}.afterSave`;
    const name = getHookId(workflow, event);
    if (!this.events.has(name)) {
      // NOTE: toggle cache depends on new date
      const listener = (data, options) => {
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
        // * cron only          : invalid
        // * startsOn and endsOn: equal to only startsOn
        // * startsOn and cron  : startsOn in cycle and cron in cycle
        // * endsOn and cron    : invalid
        // * all                : all rules effect
        // * none               : invalid
        // this means, startsOn and cron should be present at least one
        // and no startsOn equals run on cron, and could ends on endsOn,
        // this will be a little wired, only means the end date should use collection field.
        const now = new Date();
        now.setMilliseconds(0);
        const timestamp = now.getTime();
        const startTime = getDataOptionTime(data, startsOn, now);
        const endTime = getDataOptionTime(data, endsOn, now, -1);
        if (!startTime && !cron) {
          return;
        }
        if (startTime && startTime > timestamp + this.cacheCycle) {
          return;
        }
        if (endTime && endTime <= timestamp) {
          console.log(now, startTime, endTime);
          return;
        }
        if (!cronInCycle.call(this, workflow, now)) {
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
    const { startsOn, endsOn, collection } = workflow.config;
    const starts = getDateRangeFilter(startsOn, now, '$gte', this.cacheCycle);
    if (!starts) {
      return false;
    }
    const ends = getDateRangeFilter(endsOn, now, '$lt', this.cacheCycle);
    if (!ends) {
      return false;
    }
    const filter = merge(starts, ends);
    // if neither startsOn nor endsOn is provided
    if (!Object.keys(filter).length) {
      // consider as invalid
      return false;
    }

    const repo = this.db.getCollection(collection).repository;
    const count = await repo.count({
      filter
    });

    return Boolean(count);
  },

  async trigger(workflow, date) {
    const {
      collection,
      startsOn,
      endsOn,
      cron
    } = workflow.config;

    if (typeof startsOn !== 'object') {
      return;
    }

    const timestamp = date.getTime();
    const startTimestamp = timestamp - (startsOn.offset ?? 0) * (startsOn.unit ?? 1000);

    let filter
    if (!cron) {
      // startsOn exactly equal to now in 1s
      filter = {
        [startsOn.field]: {
          $gte: new Date(startTimestamp),
          $lt: new Date(startTimestamp + 1000)
        }
      };
    } else {
      // startsOn not after now
      filter = {
        [startsOn.field]: {
          $lt: new Date(startTimestamp)
        }
      };

      switch (typeof endsOn) {
        case 'string':
          const endTime = Date.parse(endsOn);
          if (!endTime || endTime <= timestamp) {
            return;
          }
          break;
        case 'object':
          filter[endsOn.field] = {
            $gte: new Date(timestamp - (endsOn.offset ?? 0) * (endsOn.unit ?? 1000) + 1000)
          };
          break;
        default:
          break;
      }
    }
    const repo = this.db.getCollection(collection).repository;
    const instances = await repo.find({
      filter
    });
    console.log('trigger at', date);

    instances.forEach(item => {
      workflow.trigger({
        date,
        data: item.get()
      });
    });
  }
});


function cronInCycle(this: ScheduleTrigger, workflow, now: Date): boolean {
  const { cron } = workflow.config;
  // no cron means no need to rerun
  // but if in current cycle, should be put in cache
  // no cron but in current cycle means startsOn or endsOn has been configured
  // so we need to more info to determine if necessary config items
  if (!cron) {
    return true;
  }

  const currentDate = new Date(now);
  currentDate.setMilliseconds(-1);
  const timestamp = now.getTime();
  const interval = parser.parseExpression(cron, { currentDate });
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
    ({ config }) => ['cron', 'startsOn'].some(key => config[key]),
    cronInCycle,
    function(workflow, now) {
      const { mode } = workflow.config;
      const modeHandlers = ScheduleModes.get(mode);
      return modeHandlers.shouldCache.call(this, workflow, now);
    }
  ];

  static TriggerRules = [
    ({ config, executed }) => config.limit ? executed < config.limit : true,
    ({ config }) => ['cron', 'startsOn'].some(key => config[key]),
    function (workflow, now) {
      const { cron } = workflow.config;
      if (!cron) {
        return true;
      }

      const currentDate = new Date(now);
      currentDate.setMilliseconds(-1);
      const timestamp = now.getTime();
      const interval = parser.parseExpression(cron, { currentDate });
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
    for (const workflow of this.cache.values()) {
      if (this.shouldTrigger(workflow, now)) {
        this.trigger(workflow, now);
      }
    }
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
