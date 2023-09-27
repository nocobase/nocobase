import { CronJob } from 'cron';
import Application from '../application';

interface Job {
  time: string;
  onTick: () => void;
}

export class CronJobsManager {
  private jobs: CronJob[] = [];

  private _started = false;

  constructor(private app: Application) {
    app.on('beforeStop', async () => {
      this.stop();
    });

    app.on('afterStart', async () => {
      this.start();
    });

    app.on('beforeReload', async () => {
      this.stop();
    });
  }

  public get started() {
    return this._started;
  }

  public addJob(job: Job) {
    this.jobs.push(new CronJob(job.time, job.onTick));
  }

  public start() {
    this.jobs.forEach((job) => {
      job.start();
    });
    this._started = true;
  }

  public stop() {
    this.jobs.forEach((job) => {
      job.stop();
    });
    this._started = false;
  }
}
