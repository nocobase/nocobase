import Plugin from '..';
import { JOB_STATUS } from "../constants";
import ExecutionModel from '../models/Execution';
import JobModel from '../models/Job';

type ValueOf<T> = T[keyof T];

interface DelayConfig {
  endStatus: ValueOf<typeof JOB_STATUS>;
  duration: number;
}

export default class {
  constructor(protected plugin: Plugin) {
    plugin.app.on('beforeStart', () => this.load());
  }

  async load() {
    // 1. load all executions which stopped by delay
    const { model } = this.plugin.db.getCollection('jobs');
    const jobs = await model.findAll({
      where: {
        status: JOB_STATUS.PENDING
      },
      include: [
        {
          association: 'execution'
        },
        {
          association: 'node',
          where: {
            type: 'delay'
          },
          required: true
        }
      ]
    }) as JobModel[];

    jobs.forEach(job => {
      this.schedule(job, job.node.config.duration);
    });
  }

  schedule(job, duration: number) {
    const now = new Date();
    const createdAt = Date.parse(job.createdAt);
    const delay = createdAt + duration - now.getTime();
    const trigger = this.trigger.bind(this, job);
    if (delay > 0) {
      setTimeout(trigger, duration);
    } else {
      // NOTE: trigger missed job
      trigger();
    }
  }

  async trigger(job) {
    const { execution = await job.getExecution() as ExecutionModel } = job;
    const processor = this.plugin.createProcessor(execution);
    await processor.resume(job);
  }

  run = async (node, prevJob, processor) => {
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      result: null,
      nodeId: node.id,
      upstreamId: prevJob?.id ?? null
    });

    const { duration } = node.config as DelayConfig;
    // add to schedule
    this.schedule(job, duration);

    return processor.end(node, job);
  };

  resume = async (node, prevJob, processor) => {
    const { endStatus } = node.config as DelayConfig;
    prevJob.set('status', endStatus);
    return prevJob;
  };
}
