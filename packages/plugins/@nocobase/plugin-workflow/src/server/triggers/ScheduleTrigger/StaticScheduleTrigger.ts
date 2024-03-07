import parser from 'cron-parser';

import type Plugin from '../../Plugin';
import { SCHEDULE_MODE, parseDateWithoutMs } from './utils';

const MAX_SAFE_INTERVAL = 2147483647;

export default class StaticScheduleTrigger {
  private timers: Map<string, NodeJS.Timeout | null> = new Map();

  constructor(public workflow: Plugin) {
    workflow.app.on('afterStart', async () => {
      const WorkflowRepo = this.workflow.app.db.getRepository('workflows');
      const workflows = await WorkflowRepo.find({
        filter: { enabled: true, type: 'schedule', 'config.mode': SCHEDULE_MODE.STATIC },
      });

      this.inspect(workflows);
    });

    workflow.app.on('beforeStop', () => {
      for (const timer of this.timers.values()) {
        clearInterval(timer);
      }
    });
  }

  inspect(workflows) {
    const now = new Date();

    workflows.forEach((workflow) => {
      const nextTime = this.getNextTime(workflow, now);
      if (nextTime) {
        this.workflow
          .getLogger(workflow.id)
          .info(`caching scheduled workflow will run at: ${new Date(nextTime).toISOString()}`);
      } else {
        this.workflow.getLogger(workflow.id).info('workflow will not be scheduled');
      }
      this.schedule(workflow, nextTime, nextTime >= now.getTime());
    });
  }

  getNextTime({ config, allExecuted }, currentDate, nextSecond = false) {
    if (config.limit && allExecuted >= config.limit) {
      return null;
    }
    if (!config.startsOn) {
      return null;
    }
    currentDate.setMilliseconds(nextSecond ? 1000 : 0);
    const timestamp = currentDate.getTime();
    const startTime = parseDateWithoutMs(config.startsOn);
    if (startTime > timestamp) {
      return startTime;
    }
    if (config.repeat) {
      const endTime = config.endsOn ? parseDateWithoutMs(config.endsOn) : null;
      if (endTime && endTime < timestamp) {
        return null;
      }
      if (typeof config.repeat === 'string') {
        const interval = parser.parseExpression(config.repeat, { currentDate });
        const next = interval.next();
        return next.getTime();
      } else if (typeof config.repeat === 'number') {
        const next = timestamp + config.repeat - ((timestamp - startTime) % config.repeat);
        return next;
      } else {
        return null;
      }
    } else {
      if (startTime < timestamp) {
        return null;
      }
      return timestamp;
    }
  }

  schedule(workflow, nextTime, toggle = true) {
    if (toggle) {
      const key = `${workflow.id}@${nextTime}`;
      if (!this.timers.has(key)) {
        const interval = Math.max(nextTime - Date.now(), 0);
        if (interval > MAX_SAFE_INTERVAL) {
          this.timers.set(
            key,
            setTimeout(() => {
              this.timers.delete(key);
              this.schedule(workflow, nextTime);
            }, MAX_SAFE_INTERVAL),
          );
        } else {
          this.timers.set(key, setTimeout(this.trigger.bind(this, workflow, nextTime), interval));
        }
      }
    } else {
      for (const [key, timer] of this.timers.entries()) {
        if (key.startsWith(`${workflow.id}@`)) {
          clearTimeout(timer);
          this.timers.delete(key);
        }
      }
    }
  }

  async trigger(workflow, time) {
    this.timers.delete(`${workflow.id}@${time}`);

    this.workflow.trigger(workflow, { date: new Date(time) });

    if (!workflow.config.repeat || (workflow.config.limit && workflow.allExecuted >= workflow.config.limit - 1)) {
      return;
    }

    const nextTime = this.getNextTime(workflow, new Date(), true);
    if (nextTime) {
      this.schedule(workflow, nextTime);
    }
  }

  on(workflow) {
    this.inspect([workflow]);
  }

  off(workflow) {
    this.schedule(workflow, null, false);
  }
}
