import { ITokenBlacklistService } from '@nocobase/auth';
import { Repository } from '@nocobase/database';
import { CronJob } from 'cron';
import AuthPlugin from './plugin';

export class TokenBlacklistService implements ITokenBlacklistService {
  repo: Repository;
  cronJob: CronJob;

  constructor(protected plugin: AuthPlugin) {
    this.repo = plugin.db.getRepository('tokenBlacklist');
  }

  get app() {
    return this.plugin.app;
  }

  async has(token: string) {
    return !!(await this.repo.findOne({
      filter: {
        token,
      },
    }));
  }

  async add(values) {
    await this.deleteExpiredTokens();
    return this.repo.model.findOrCreate({
      defaults: values,
      where: {
        token: values.token,
      },
    });
  }

  async deleteExpiredTokens() {
    return this.repo.destroy({
      filter: {
        expiration: {
          $dateNotAfter: new Date(),
        },
      },
    });
  }
}
