import { fn, literal, Op, Transactionable, where } from '@nocobase/database';
import parser from 'cron-parser';
import type Plugin from '../../Plugin';
import type { WorkflowModel } from '../../types';
import { parseDateWithoutMs, SCHEDULE_MODE } from './utils';
import { parseCollectionName } from '@nocobase/data-source-manager';

export type ScheduleOnField = {
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
  endsOn?: string | ScheduleOnField;
}

function getOnTimestampWithOffset({ field, offset = 0, unit = 1000 }: ScheduleOnField, now: Date) {
  if (!field) {
    return null;
  }
  const timestamp = now.getTime();
  // onDate + offset > now
  // onDate > now - offset
  return timestamp - offset * unit;
}

function getDataOptionTime(record, on, dir = 1) {
  if (!on) {
    return null;
  }
  switch (typeof on) {
    case 'string': {
      const time = parseDateWithoutMs(on);
      return time ? time : null;
    }
    case 'object': {
      const { field, offset = 0, unit = 1000 } = on;
      if (!record.get(field)) {
        return null;
      }
      const second = new Date(record.get(field).getTime());
      second.setMilliseconds(0);
      return second.getTime() + offset * unit * dir;
    }
    default:
      return null;
  }
}

const DialectTimestampFnMap: { [key: string]: (col: string) => string } = {
  postgres(col) {
    return `CAST(FLOOR(extract(epoch from "${col}")) AS INTEGER)`;
  },
  mysql(col) {
    return `CAST(FLOOR(UNIX_TIMESTAMP(\`${col}\`)) AS SIGNED INTEGER)`;
  },
  sqlite(col) {
    return `CAST(FLOOR(unixepoch(${col})) AS INTEGER)`;
  },
};
DialectTimestampFnMap.mariadb = DialectTimestampFnMap.mysql;

function getCronNextTime(cron, currentDate: Date): number {
  const interval = parser.parseExpression(cron, { currentDate });
  const next = interval.next();
  return next.getTime();
}

function matchCronNextTime(cron, currentDate: Date, range: number): boolean {
  return getCronNextTime(cron, currentDate) - currentDate.getTime() <= range;
}

function getHookId(workflow, type: string) {
  return `${type}#${workflow.id}`;
}

export default class ScheduleTrigger {
  events = new Map();

  private timer: NodeJS.Timeout | null = null;

  private cache: Map<string, any> = new Map();

  // caching workflows in range, default to 5min
  cacheCycle = 300_000;

  constructor(public workflow: Plugin) {
    workflow.app.on('afterStart', async () => {
      if (this.timer) {
        return;
      }

      this.timer = setInterval(() => this.reload(), this.cacheCycle);

      this.reload();
    });

    workflow.app.on('beforeStop', () => {
      if (this.timer) {
        clearInterval(this.timer);
      }

      for (const [key, timer] of this.cache.entries()) {
        clearTimeout(timer);
        this.cache.delete(key);
      }
    });
  }

  async reload() {
    const WorkflowRepo = this.workflow.app.db.getRepository('workflows');
    const workflows = await WorkflowRepo.find({
      filter: { enabled: true, type: 'schedule', 'config.mode': SCHEDULE_MODE.DATE_FIELD },
    });

    // NOTE: clear cached jobs in last cycle
    this.cache = new Map();

    this.inspect(workflows);
  }

  inspect(workflows: WorkflowModel[]) {
    const now = new Date();

    workflows.forEach(async (workflow) => {
      const records = await this.loadRecordsToSchedule(workflow, now);
      records.forEach((record) => {
        const nextTime = this.getRecordNextTime(workflow, record);
        this.schedule(workflow, record, nextTime, Boolean(nextTime));
      });
    });
  }

  // 1. startsOn in range -> yes
  // 2. startsOn before now, has no repeat -> no
  // 3. startsOn before now, and has repeat:
  //   a. repeat out of range -> no
  //   b. repeat in range (number or cron):
  //     i. endsOn after now -> yes
  //     ii. endsOn before now -> no
  async loadRecordsToSchedule(
    { config: { collection, limit, startsOn, repeat, endsOn }, allExecuted }: WorkflowModel,
    currentDate: Date,
  ) {
    const { db } = this.workflow.app;
    if (limit && allExecuted >= limit) {
      return [];
    }
    if (!startsOn) {
      return [];
    }
    const timestamp = currentDate.getTime();

    const startTimestamp = getOnTimestampWithOffset(startsOn, currentDate);
    if (!startTimestamp) {
      return [];
    }

    const range = this.cacheCycle * 2;

    const conditions: any[] = [
      {
        [startsOn.field]: {
          // cache next 2 cycles
          [Op.lt]: new Date(startTimestamp + range),
        },
      },
    ];

    if (repeat) {
      // when repeat is number, means repeat after startsOn
      // (now - startsOn) % repeat <= cacheCycle
      if (typeof repeat === 'number') {
        const tsFn = DialectTimestampFnMap[db.options.dialect];
        if (repeat > range && tsFn) {
          const modExp = fn(
            'MOD',
            literal(`${Math.round(timestamp / 1000)} - ${tsFn(startsOn.field)}`),
            Math.round(repeat / 1000),
          );
          conditions.push(where(modExp, { [Op.lt]: Math.round(range / 1000) }));
        }
      } else if (typeof repeat === 'string') {
        if (!matchCronNextTime(repeat, currentDate, range)) {
          return [];
        }
      }

      if (endsOn) {
        const now = new Date();
        const endTimestamp = getOnTimestampWithOffset(endsOn, now);
        if (!endTimestamp) {
          return [];
        }
        if (typeof endsOn === 'string') {
          if (endTimestamp <= timestamp) {
            return [];
          }
        } else {
          conditions.push({
            [endsOn.field]: {
              [Op.gte]: new Date(endTimestamp),
            },
          });
        }
      }
    } else {
      conditions.push({
        [startsOn.field]: {
          [Op.gte]: new Date(startTimestamp),
        },
      });
    }

    const { model } = db.getCollection(collection);
    return model.findAll({
      where: {
        [Op.and]: conditions,
      },
    });
  }

  getRecordNextTime(workflow: WorkflowModel, record, nextSecond = false) {
    const {
      config: { startsOn, endsOn, repeat, limit },
      allExecuted,
    } = workflow;
    if (limit && allExecuted >= limit) {
      return null;
    }
    const range = this.cacheCycle;
    const now = new Date();
    now.setMilliseconds(nextSecond ? 1000 : 0);
    const timestamp = now.getTime();
    const startTime = getDataOptionTime(record, startsOn);
    const endTime = getDataOptionTime(record, endsOn);
    let nextTime = null;
    if (!startTime) {
      return null;
    }
    if (startTime > timestamp + range) {
      return null;
    }
    if (startTime >= timestamp) {
      return !endTime || (endTime >= startTime && endTime < timestamp + range) ? startTime : null;
    } else {
      if (!repeat) {
        return null;
      }
    }
    if (typeof repeat === 'number') {
      const nextRepeatTime = ((startTime - timestamp) % repeat) + repeat;
      if (nextRepeatTime > range) {
        return null;
      }
      if (endTime && endTime < timestamp + nextRepeatTime) {
        return null;
      }
      nextTime = timestamp + nextRepeatTime;
    } else if (typeof repeat === 'string') {
      nextTime = getCronNextTime(repeat, now);
      if (nextTime - timestamp > range) {
        return null;
      }
      if (endTime && endTime < nextTime) {
        return null;
      }
    }
    if (endTime && endTime <= timestamp) {
      return null;
    }
    return nextTime;
  }

  schedule(workflow: WorkflowModel, record, nextTime, toggle = true, options = {}) {
    const [dataSourceName, collectionName] = parseCollectionName(workflow.config.collection);
    const { filterTargetKey } = this.workflow.app.dataSourceManager.dataSources
      .get(dataSourceName)
      .collectionManager.getCollection(collectionName);
    const recordPk = record.get(filterTargetKey);
    if (toggle) {
      const nextInterval = Math.max(0, nextTime - Date.now());
      const key = `${workflow.id}:${recordPk}@${nextTime}`;

      if (!this.cache.has(key)) {
        if (nextInterval) {
          this.cache.set(key, setTimeout(this.trigger.bind(this, workflow, record, nextTime), nextInterval));
        } else {
          return this.trigger(workflow, record, nextTime, options);
        }
      }
    } else {
      for (const [key, timer] of this.cache.entries()) {
        if (key.startsWith(`${workflow.id}:${recordPk}@`)) {
          clearTimeout(timer);
          this.cache.delete(key);
        }
      }
    }
  }

  async trigger(workflow: WorkflowModel, record, nextTime, { transaction }: Transactionable = {}) {
    const [dataSourceName, collectionName] = parseCollectionName(workflow.config.collection);
    const { repository, filterTargetKey } = this.workflow.app.dataSourceManager.dataSources
      .get(dataSourceName)
      .collectionManager.getCollection(collectionName);
    const recordPk = record.get(filterTargetKey);
    const data = await repository.findOne({
      filterByTk: recordPk,
      appends: workflow.config.appends,
      transaction,
    });
    const key = `${workflow.id}:${recordPk}@${nextTime}`;
    this.cache.delete(key);
    this.workflow.trigger(workflow, {
      data: data.toJSON(),
      date: new Date(nextTime),
    });

    if (!workflow.config.repeat || (workflow.config.limit && workflow.allExecuted >= workflow.config.limit - 1)) {
      return;
    }

    const n = this.getRecordNextTime(workflow, data, true);
    if (n) {
      this.schedule(workflow, data, n, true);
    }
  }

  on(workflow: WorkflowModel) {
    this.inspect([workflow]);

    const { collection } = workflow.config;
    const [dataSourceName, collectionName] = parseCollectionName(collection);
    const event = `${collectionName}.afterSaveWithAssociations`;
    const eventKey = `${collection}.afterSaveWithAssociations`;
    const name = getHookId(workflow, event);
    if (this.events.has(name)) {
      return;
    }

    const listener = async (data, { transaction }) => {
      const nextTime = this.getRecordNextTime(workflow, data);
      return this.schedule(workflow, data, nextTime, Boolean(nextTime), { transaction });
    };

    this.events.set(name, listener);
    // @ts-ignore
    this.workflow.app.dataSourceManager.dataSources.get(dataSourceName).collectionManager.db.on(event, listener);
  }

  off(workflow: WorkflowModel) {
    for (const [key, timer] of this.cache.entries()) {
      if (key.startsWith(`${workflow.id}:`)) {
        clearTimeout(timer);
        this.cache.delete(key);
      }
    }

    const { collection } = workflow.config;
    const [dataSourceName, collectionName] = parseCollectionName(collection);
    const event = `${collectionName}.afterSaveWithAssociations`;
    const eventKey = `${collection}.afterSaveWithAssociations`;
    const name = getHookId(workflow, event);
    if (this.events.has(eventKey)) {
      const listener = this.events.get(name);
      // @ts-ignore
      const { db } = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName).collectionManager;
      db.off(event, listener);
      this.events.delete(eventKey);
    }
  }
}
