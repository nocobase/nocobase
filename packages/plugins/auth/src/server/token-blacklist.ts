import { ITokenBlacklistService } from '@nocobase/auth';
import { Repository } from '@nocobase/database';
import { CronJob } from 'cron';
import AuthPlugin from './plugin';

export class TokenBlacklistService implements ITokenBlacklistService {
  repo: Repository;
  cornJob: CronJob;

  constructor(protected plugin: AuthPlugin) {
    this.repo = plugin.db.getRepository('tokenBlacklist');
    this.cornJob = this.createCronJob();
  }

  get app() {
    return this.plugin.app;
  }

  createCronJob() {
    const cornJob = new CronJob(
      // every day at 03:00
      '0 3 * * *', //
      async () => {
        this.app.logger.info(`${this.plugin.name}: Start delete expired blacklist token`);
        await this.deleteByExpiration();
        this.app.logger.info(`${this.plugin.name}: End delete expired blacklist token`);
      },
      null,
    );

    this.app.once('beforeStart', () => {
      cornJob.start();
    });

    this.app.once('beforeStop', () => {
      cornJob.stop();
    });

    return cornJob;
  }

  async has(token: string) {
    return !!(await this.repo.findOne({
      where: {
        token,
      },
    }));
  }
  async add(values) {
    return this.repo.model.findOrCreate({
      defaults: values,
      where: {
        token: values.token,
      },
    });
  }
  async deleteByExpiration() {
    return this.repo.destroy({
      filter: {
        expiration: {
          $dateNotAfter: new Date(),
        },
      },
    });
  }
}
