/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import WorkflowPlugin, {
  Processor,
  Instruction,
  JOB_STATUS,
  JobModel,
  EXECUTION_STATUS,
} from '@nocobase/plugin-workflow';

type ValueOf<T> = T[keyof T];

interface DelayConfig {
  endStatus: ValueOf<typeof JOB_STATUS>;
  duration: number;
}

export default class extends Instruction {
  timers: Map<string, NodeJS.Timeout> = new Map();

  constructor(public workflow: WorkflowPlugin) {
    super(workflow);

    workflow.app.on('afterStart', this.load);
    workflow.app.on('beforeStop', this.unload);
  }

  load = async () => {
    const { model } = this.workflow.app.db.getCollection('jobs');
    const jobs = (await model.findAll({
      where: {
        status: JOB_STATUS.PENDING,
      },
      include: [
        {
          association: 'execution',
          attributes: [],
          where: {
            status: EXECUTION_STATUS.STARTED,
          },
          required: true,
        },
        {
          association: 'node',
          attributes: ['config'],
          where: {
            type: 'delay',
          },
          required: true,
        },
      ],
    })) as JobModel[];

    jobs.forEach((job) => {
      this.schedule(job);
    });
  };

  unload = () => {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers = new Map();
  };

  schedule(job) {
    const createdAt = new Date(job.createdAt).getTime();
    const delay = createdAt + job.result - Date.now();
    if (delay > 0) {
      const trigger = this.trigger.bind(this, job.id);
      this.timers.set(job.id.toString(), setTimeout(trigger, delay));
    } else {
      this.trigger(job);
    }
  }

  async trigger(jobOrId: JobModel | string) {
    const { model } = this.workflow.app.db.getCollection('jobs');
    const job =
      jobOrId instanceof model
        ? jobOrId
        : await this.workflow.app.db.getRepository('jobs').findOne({ filterByTk: jobOrId });
    if (!job.execution) {
      job.execution = await job.getExecution();
    }
    if (job.execution.status === EXECUTION_STATUS.STARTED) {
      this.workflow.resume(job);
    }
    const idStr = job.id.toString();
    if (this.timers.get(idStr)) {
      clearTimeout(this.timers.get(idStr));
      this.timers.delete(idStr);
    }
  }

  async run(node, prevJob, processor: Processor) {
    const duration = processor.getParsedValue(node.config.duration || 1, node.id) * (node.config.unit || 1_000);
    const job = processor.saveJob({
      status: JOB_STATUS.PENDING,
      result: duration,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });

    // add to schedule
    this.schedule(job);
    processor.logger.debug(`delay node (${node.id}) will resume after ${duration}ms`);

    return null;
  }

  async resume(node, prevJob, processor: Processor) {
    const { endStatus } = node.config as DelayConfig;
    prevJob.set('status', endStatus);
    return prevJob;
  }
}
