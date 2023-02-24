import parser from 'cron-parser';
import { literal, Op, where, fn } from 'sequelize';
import Plugin, { Trigger } from '..';
import WorkflowModel from '../models/Workflow';

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
  on?(this: ScheduleTrigger, workflow: WorkflowModel): void;
  off?(this: ScheduleTrigger, workflow: WorkflowModel): void;
  shouldCache(this: ScheduleTrigger, workflow: WorkflowModel, now: Date): Promise<boolean> | boolean;
  trigger(this: ScheduleTrigger, workflow: WorkflowModel, now: Date): any;
}

const ScheduleModes = new Map<number, ScheduleMode>();

function parseDateWithoutMs(date: string) {
  return Math.floor(Date.parse(date) / 1000) * 1000;
}

ScheduleModes.set(SCHEDULE_MODE.CONSTANT, {
  shouldCache(workflow, now) {
    const { startsOn, endsOn, repeat } = workflow.config;
    const timestamp = now.getTime();

    // NOTE: align to second start
    const startTime = parseDateWithoutMs(startsOn);
    if (!startTime || (startTime > timestamp + this.cacheCycle)) {
      return false;
    }

    if (repeat) {
      if (typeof repeat === 'number') {
        const next = timestamp - (timestamp - startTime) % repeat + repeat;
        if (next <= timestamp || next > timestamp + this.cacheCycle) {
          return false;
        }
      }

      if (endsOn) {
        const endTime = parseDateWithoutMs(endsOn);
        if (!endTime || endTime <= timestamp) {
          return false;
        }
      }
    } else {
      if (startTime <= timestamp) {
        return false;
      }
    }

    return true;
  },
  trigger(workflow, now) {
    const { startsOn, endsOn, repeat } = workflow.config;
    const timestamp = now.getTime();
    // NOTE: align to second start
    const startTime = parseDateWithoutMs(startsOn);
    if (!startTime || startTime > timestamp) {
      return;
    }

    if (repeat) {
      if (typeof repeat === 'number') {
        if (Math.round(timestamp - startTime) % repeat) {
          return;
        }
      }

      if (endsOn) {
        const endTime = parseDateWithoutMs(endsOn);
        if (!endTime || endTime < timestamp) {
          return;
        }
      }
    } else {
      if (startTime !== timestamp) {
        return;
      }
    }

    return this.plugin.trigger(workflow, { date: now });
  }
});

function getOnTimestampWithOffset(on, now: Date) {
  switch (typeof on) {
    case 'string':
      return parseDateWithoutMs(on);
    case 'object':
      const { field, offset = 0, unit = 1000 } = on;
      if (!field) {
        return null;
      }
      const timestamp = now.getTime();
      // onDate + offset > now
      // onDate > now - offset
      return timestamp - offset * unit;
    default:
      return null;
  }
}

function getDataOptionTime(data, on, dir = 1) {
  if (!on) {
    return null;
  }
  switch (typeof on) {
    case 'string':
      const time = parseDateWithoutMs(on);
      return time ? time : null;
    case 'object':
      const { field, offset = 0, unit = 1000 } = on;
      return data.get(field) ? data.get(field).getTime() - offset * unit * dir : null;
    default:
      return null;
  }
}

function getHookId(workflow, type: string) {
  return `${type}#${workflow.id}`;
}

const DialectTimestampFnMap: { [key: string]: Function } = {
  postgres(col) {
    return `CAST(FLOOR(extract(epoch from "${col}")) AS INTEGER)`;
  },
  mysql(col) {
    return `CAST(FLOOR(UNIX_TIMESTAMP(\`${col}\`)) AS SIGNED INTEGER)`;
  },
  sqlite(col) {
    return `CAST(FLOOR(unixepoch(${col})) AS INTEGER)`;
  }
};
DialectTimestampFnMap.mariadb = DialectTimestampFnMap.mysql;

ScheduleModes.set(SCHEDULE_MODE.COLLECTION_FIELD, {
  on(workflow) {
    const { collection, startsOn, endsOn, repeat } = workflow.config;
    const event = `${collection}.afterSave`;
    const name = getHookId(workflow, event);
    if (this.events.has(name)) {
      return;
    }
    // NOTE: toggle cache depends on new date
    const listener = async (data, options) => {
      const now = new Date();
      now.setMilliseconds(0);
      const timestamp = now.getTime();
      const startTime = getDataOptionTime(data, startsOn);
      const endTime = getDataOptionTime(data, endsOn, -1);
      if (!startTime) {
        return;
      }
      if (startTime && startTime > timestamp + this.cacheCycle) {
        return;
      }
      if (endTime && endTime <= timestamp) {
        return;
      }
      if (!matchNext.call(this, workflow, now)) {
        return;
      }
      if (typeof repeat === 'number'
        && repeat > this.cacheCycle
        && (timestamp - startTime) % repeat > this.cacheCycle
      ) {
        return;
      }

      this.setCache(workflow);
    };
    this.events.set(name, listener);
    this.plugin.app.db.on(event, listener);
  },

  off(workflow) {
    const { collection } = workflow.config;
    const event = `${collection}.afterSave`;
    const name = getHookId(workflow, event);
    if (this.events.has(name)) {
      const listener = this.events.get(name);
      this.events.delete(name);
      this.plugin.app.db.off(event, listener);
    }
  },

  async shouldCache(workflow, now) {
    const { db } = this.plugin.app;
    const { startsOn, endsOn, repeat, collection } = workflow.config;
    const timestamp = now.getTime();

    const startTimestamp = getOnTimestampWithOffset(startsOn, now);
    if (!startTimestamp) {
      return false;
    }

    const conditions: any[] = [
      {
        [startsOn.field]: {
          [Op.lt]: new Date(startTimestamp + this.cacheCycle)
        }
      }
    ];

    // when repeat is number, means repeat after startsOn
    // (now - startsOn) % repeat <= cacheCycle
    if (repeat) {
      const tsFn = DialectTimestampFnMap[db.options.dialect!];
      if (typeof repeat === 'number'
        && repeat > this.cacheCycle
        && tsFn
      ) {
        conditions.push(where(
          fn('MOD', literal(`${Math.round(timestamp / 1000)} - ${tsFn(startsOn.field)}`), Math.round(repeat / 1000)),
          { [Op.lt]: Math.round(this.cacheCycle / 1000) }
        ));
        // conditions.push(literal(`mod(${timestamp} - ${tsFn(startsOn.field)} * 1000, ${repeat}) < ${this.cacheCycle}`));
      }

      if (endsOn) {
        const endTimestamp = getOnTimestampWithOffset(endsOn, now);
        if (!endTimestamp) {
          return false;
        }
        if (typeof endsOn === 'string') {
          if (endTimestamp <= timestamp) {
            return false;
          }
        } else {
          conditions.push({
            [endsOn.field]: {
              [Op.gte]: new Date(endTimestamp + this.interval)
            }
          });
        }
      }
    } else {
      conditions.push({
        [startsOn.field]: {
          [Op.gte]: new Date(startTimestamp)
        }
      });
    }

    const { model } = db.getCollection(collection);
    const count = await model.count({
      where: { [Op.and]: conditions }
    });

    return Boolean(count);
  },

  async trigger(workflow, now: Date) {
    const { startsOn, repeat, endsOn, collection } = workflow.config;
    const timestamp = now.getTime();

    const startTimestamp = getOnTimestampWithOffset(startsOn, now);
    if (!startTimestamp) {
      return false;
    }

    const conditions: any[] = [
      {
        [startsOn.field]: {
          [Op.lt]: new Date(startTimestamp + this.interval)
        }
      }
    ];

    if (repeat) {
      // startsOn not after now
      conditions.push({
        [startsOn.field]: {
          [Op.lt]: new Date(startTimestamp)
        }
      });

      const tsFn = DialectTimestampFnMap[this.plugin.app.db.options.dialect!];
      if (typeof repeat === 'number' && tsFn) {
        conditions.push(where(
          fn('MOD', literal(`${Math.round(timestamp / 1000)} - ${tsFn(startsOn.field)}`), Math.round(repeat / 1000)),
          { [Op.eq]: 0 }
        ));
        // conditions.push(literal(`MOD(CAST(${timestamp} AS BIGINT) - CAST((FLOOR(${tsFn(startsOn.field)}) AS BIGINT) * 1000), ${repeat}) = 0`));
      }

      if (endsOn) {
        const endTimestamp = getOnTimestampWithOffset(endsOn, now);
        if (!endTimestamp) {
          return false;
        }

        if (typeof endsOn === 'string') {
          if (endTimestamp <= timestamp) {
            return false;
          }
        } else {
          conditions.push({
            [endsOn.field]: {
              [Op.gte]: new Date(endTimestamp + this.interval)
            }
          });
        }
      }
    } else {
      // startsOn exactly equal to now in 1s
      conditions.push({
        [startsOn.field]: {
          [Op.gte]: new Date(startTimestamp)
        }
      });
    }

    const { model } = this.plugin.app.db.getCollection(collection);
    const instances = await model.findAll({
      where: {
        [Op.and]: conditions
      }
    });

    instances.forEach(item => {
      this.plugin.trigger(workflow, {
        date: now,
        data: item.get()
      });
    });
  }
});


function matchNext(this: ScheduleTrigger, workflow, now: Date, range: number = this.cacheCycle): boolean {
  const { repeat } = workflow.config;
  // no repeat means no need to rerun
  // but if in current cycle, should be put in cache
  // no repeat but in current cycle means startsOn has been configured
  // so we need to more info to determine if necessary config items
  if (typeof repeat !== 'string') {
    return true;
  }

  const currentDate = new Date(now);
  currentDate.setMilliseconds(-1);
  const timestamp = now.getTime();
  const interval = parser.parseExpression(repeat, { currentDate });
  let next = interval.next();

  // NOTE: cache all workflows will be matched in current cycle
  if (next.getTime() - timestamp <= range) {
    return true;
  }

  return false;
}

export default class ScheduleTrigger extends Trigger {
  static CacheRules = [
    ({ config, allExecuted }) => (config.limit ? allExecuted < config.limit : true) && config.startsOn,
    matchNext,
    function(workflow, now) {
      const { mode } = workflow.config;
      const modeHandlers = ScheduleModes.get(mode);
      if (!modeHandlers) {
        return false;
      }
      return modeHandlers.shouldCache.call(this, workflow, now);
    }
  ];

  static TriggerRules = [
    ({ config, allExecuted }) => (config.limit ? allExecuted < config.limit : true) && config.startsOn,
    function (workflow, now) {
      return matchNext.call(this, workflow, now, 0);
    }
  ];

  events = new Map();

  private timer: NodeJS.Timeout | null = null;

  private cache: Map<number | string, any> = new Map();

  // running interval, default to 1s
  interval: number = 1_000;
  // caching workflows in range, default to 1min
  cacheCycle: number = 60_000;

  constructor(plugin: Plugin) {
    super(plugin);

    plugin.app.on('beforeStop', () => {
      if (this.timer) {
        clearInterval(this.timer);
      }
    });
  }

  init() {
    if (this.timer) {
      return;
    }

    const now = new Date();

    // NOTE: assign to this.timer to avoid duplicated initialization
    this.timer = setTimeout(
      this.run,
      // NOTE:
      //  try to align to system time on each second starts,
      //  after at least 1 second initialized for anything to get ready.
      //  so jobs in 2 seconds will be missed at first start.
      1_000 - now.getMilliseconds()
    );
  }

  run = () => {
    const now = new Date();
    // 1001 to avoid 999
    const nextInterval = 1_001 - now.getMilliseconds();
    now.setMilliseconds(0);

    // NOTE: trigger `onTick` for high interval jobs which are cached in last 1 min
    this.onTick(now);

    // NOTE: reload when second match cache cycle
    if (!(now.getTime() % this.cacheCycle)) {
      this.reload();
    }

    this.timer = setTimeout(this.run, nextInterval);
  };

  async onTick(now) {
    // NOTE: trigger workflows in sequence when sqlite due to only one transaction
    const isSqlite = this.plugin.app.db.options.dialect === 'sqlite';

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
    const WorkflowModel = this.plugin.app.db.getCollection('workflows').model;
    const workflows = await WorkflowModel.findAll({
      where: { enabled: true, type: 'schedule' },
      include: [
        {
          association: 'executions',
          attributes: ['id', 'createdAt'],
          separate: true,
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

      if (should) {
        this.plugin.app.logger.info('caching scheduled workflow will run in next minute:', workflow.id);
      }

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
    if (!modeHandlers) {
      return;
    }
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
