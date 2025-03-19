/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import parser from 'cron-parser';

import type Plugin from '../../Plugin';
import { SCHEDULE_MODE, parseDateWithoutMs } from './utils';
import { WorkflowModel } from '../../types';

const MAX_SAFE_INTERVAL = 2147483647;

export default class StaticScheduleTrigger {
  private timers: Map<string, NodeJS.Timeout | null> = new Map();

  constructor(public workflow: Plugin) {
    workflow.app.on('afterStart', async () => {
      const workflows = Array.from(this.workflow.enabledCache.values()).filter(
        (item) => item.type === 'schedule' && item.config.mode === SCHEDULE_MODE.STATIC,
      );

      this.inspect(workflows);
    });

    workflow.app.on('beforeStop', () => {
      for (const timer of this.timers.values()) {
        clearInterval(timer);
      }
    });
  }

  inspect(workflows: WorkflowModel[]) {
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

  getNextTime({ config, allExecuted }: WorkflowModel, currentDate: Date, nextSecond = false) {
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

  schedule(workflow: WorkflowModel, nextTime: number, toggle = true) {
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

  async trigger(workflow: WorkflowModel, time: number) {
    const eventKey = `${workflow.id}@${time}`;
    this.timers.delete(eventKey);

    this.workflow.trigger(workflow, { date: new Date(time) }, { eventKey });

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

  execute(workflow, values, options) {
    return this.workflow.trigger(workflow, { ...values, date: values?.date ?? new Date() }, options);
  }
}
