import Plugin from '..';
import { EXECUTION_STATUS, JOB_STATUS } from "../constants";
import ExecutionModel from '../models/Execution';
import JobModel from '../models/Job';
import Processor from '../Processor';

type ValueOf<T> = T[keyof T];

interface DelayConfig {
  endStatus: ValueOf<typeof JOB_STATUS>;
  duration: number;
}

export default class {
  timers: Map<number, NodeJS.Timeout> = new Map();

  constructor(protected plugin: Plugin) {
    plugin.app.on('beforeStart', () => this.load());
    plugin.app.on('beforeStop', () => this.unload())
  }

  async load() {
    const { model } = this.plugin.db.getCollection('jobs');
    const jobs = await model.findAll({
      where: {
        status: JOB_STATUS.PENDING
      },
      include: [
        {
          association: 'execution',
          attributes: [],
          where: {
            status: EXECUTION_STATUS.STARTED
          },
          required: true
        },
        {
          association: 'node',
          attributes: ['config'],
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

  unload() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers = new Map();
  }

  schedule(job, duration: number) {
    const now = new Date();
    const createdAt = Date.parse(job.createdAt);
    const delay = createdAt + duration - now.getTime();
    const trigger = this.trigger.bind(this, job);
    this.timers.set(job.id, setTimeout(trigger, Math.max(0, delay)));
  }

  async trigger(job) {
    const execution = await job.getExecution() as ExecutionModel;
    if (execution.status === EXECUTION_STATUS.STARTED) {
      const processor = this.plugin.createProcessor(execution);
      await processor.resume(job);
    }
    if (this.timers.get(job.id)) {
      this.timers.delete(job.id);
    }
  }

  run = async (node, prevJob, processor: Processor) => {
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

  resume = async (node, prevJob, processor: Processor) => {
    const { endStatus } = node.config as DelayConfig;
    prevJob.set('status', endStatus);
    return prevJob;
  };
}
