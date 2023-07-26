import { ITokenBlacklistService } from '@nocobase/auth';
import { Repository } from '@nocobase/database';
import { CronJob } from 'cron';
import AuthPlugin from './plugin';

export class TokenBlacklistService implements ITokenBlacklistService {
  repo: Repository;
  cronJob: CronJob;

  constructor(protected plugin: AuthPlugin) {
    this.repo = plugin.db.getRepository('tokenBlacklist');
    this.cronJob = this.createCronJob();
  }

  get app() {
    return this.plugin.app;
  }

  createCronJob() {
    const cronJob = new CronJob(
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
      cronJob.start();
    });

    this.app.once('beforeStop', () => {
      cronJob.stop();
    });

    return cronJob;
  }

  async has(token: string) {
    return !!(await this.repo.findOne({
      filter: {
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
