import { TokenBlacklistService } from '@nocobase/auth';
import { Repository } from '@nocobase/database';

export const createTokenBlacklistService = (repo: Repository): TokenBlacklistService => {
  return {
    async has(token: string) {
      return !!(await repo.findOne({
        where: {
          token,
        },
      }));
    },
    async set(values) {
      return repo.create({
        values,
      });
    },
  };
};
