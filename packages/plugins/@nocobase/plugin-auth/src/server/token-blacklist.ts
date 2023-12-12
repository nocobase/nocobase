import { ITokenBlacklistService } from '@nocobase/auth';
import { Repository } from '@nocobase/database';
import { CronJob } from 'cron';
import AuthPlugin from './plugin';
import { BloomFilter } from '@nocobase/cache';

export class TokenBlacklistService implements ITokenBlacklistService {
  repo: Repository;
  cronJob: CronJob;
  bloomFilter: BloomFilter;
  cacheKey = 'token-black-list';

  constructor(protected plugin: AuthPlugin) {
    this.repo = plugin.db.getRepository('tokenBlacklist');

    // Try to create a bloom filter and cache blocked tokens in it
    plugin.app.on('beforeStart', async () => {
      try {
        this.bloomFilter = await plugin.app.cacheManager.createBloomFilter();
        // https://redis.io/docs/data-types/probabilistic/bloom-filter/#reserving-bloom-filters
        // 0.1% error rate requires 14.4 bits per item
        // 14.4*1000000/8/1024/1024 = 1.72MB
        await this.bloomFilter.reserve(this.cacheKey, 0.001, 1000000);
        const data = await this.repo.find({ fields: ['token'], raw: true });
        const tokens = data.map((item: any) => item.token);
        await this.bloomFilter.mAdd(this.cacheKey, tokens);
      } catch (error) {
        plugin.app.logger.error('token-blacklist: create bloom filter failed', error);
        this.bloomFilter = null;
      }
    });
  }

  get app() {
    return this.plugin.app;
  }

  async has(token: string) {
    if (this.bloomFilter) {
      const exists = await this.bloomFilter.exists(this.cacheKey, token);
      if (!exists) {
        return false;
      }
    }
    return !!(await this.repo.findOne({
      filter: {
        token,
      },
    }));
  }

  async add(values) {
    await this.deleteExpiredTokens();
    const { token } = values;
    if (this.bloomFilter) {
      await this.bloomFilter.add(this.cacheKey, token);
    }
    return this.repo.model.findOrCreate({
      defaults: values,
      where: {
        token,
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
