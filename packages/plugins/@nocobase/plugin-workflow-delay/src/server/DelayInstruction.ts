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
  timers: Map<number, NodeJS.Timeout> = new Map();

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
    const now = new Date();
    const createdAt = Date.parse(job.createdAt);
    const delay = createdAt + job.node.config.duration - now.getTime();
    if (delay > 0) {
      const trigger = this.trigger.bind(this, job);
      this.timers.set(job.id, setTimeout(trigger, delay));
    } else {
      this.trigger(job);
    }
  }

  async trigger(job) {
    if (!job.execution) {
      job.execution = await job.getExecution();
    }
    if (job.execution.status === EXECUTION_STATUS.STARTED) {
      this.workflow.resume(job);
    }
    if (this.timers.get(job.id)) {
      this.timers.delete(job.id);
    }
  }

  async run(node, prevJob, processor: Processor) {
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
      result: null,
      nodeId: node.id,
      nodeKey: node.key,
      upstreamId: prevJob?.id ?? null,
    });
    job.node = node;

    // add to schedule
    this.schedule(job);

    return processor.exit();
  }

  async resume(node, prevJob, processor: Processor) {
    const { endStatus } = node.config as DelayConfig;
    prevJob.set('status', endStatus);
    return prevJob;
  }
}
