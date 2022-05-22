import parser from 'cron-parser';
import { Trigger } from '.';

export interface ScheduleTriggerConfig {
  // how to repeat
  cron: string;
  // limit of repeat times
  repeat: number;

  startsOn?: string;
  endsOn?: string;

  condition: any;
}



export default class ScheduleTrigger implements Trigger {
  private db;

  private timer: NodeJS.Timeout = null;

  private cache: Map<number | string, any>;

  // running interval, default to 1s
  interval: number = 1_000;
  // caching workflows in range, default to 1min
  cacheCycle: number = 60_000;

  constructor({ app }) {
    this.db = app.db;
    this.cache = new Map();
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
    const currentDate = new Date(now);
    currentDate.setMilliseconds(-1);
    const timestamp = now.getTime();
    const second = now.getSeconds();

    for (const [key, workflow] of this.cache.entries()) {
      const { cron } = workflow.config;
      const interval = parser.parseExpression(cron, { currentDate });
      const next = interval.next();
      if (timestamp === next.getTime()) {
        workflow.trigger({ date: now });
        if (interval.next().getTime() - timestamp >= this.cacheCycle - second * this.interval) {
          this.cache.delete(key);
        }
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

    this.setCache(workflows);
  }

  setCache(workflows) {
    const now = new Date();
    now.setMilliseconds(0);
    const currentDate = new Date(now);
    currentDate.setMilliseconds(-1);
    const timestamp = now.getTime();

    workflows.forEach(workflow => {
      if (!workflow.enabled) {
        this.cache.delete(workflow.id);
        return;
      }

      const { startsOn, endsOn, cron } = workflow.config;
      const interval = parser.parseExpression(cron, { currentDate });
      let next = interval.next();
      // NOTE: trigger any workflows matching current minute
      if (next.getTime() === timestamp && !this.cache.has(workflow.id)) {
        workflow.trigger({ date: now });
        // use another next
        next = interval.next();
      }

      // NOTE: cache all workflows will be matched in current cycle
      if (next.getTime() - timestamp < this.cacheCycle) {
        this.cache.set(workflow.id, workflow);
      }
    });
  }

  on(workflow) {
    this.init();
    this.setCache([workflow]);
  }
  off(workflow) {
    this.cache.delete(workflow.id);
  }
}
