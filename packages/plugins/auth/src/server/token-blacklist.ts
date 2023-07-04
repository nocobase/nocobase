import { TokenBlacklistService } from '@nocobase/auth';
import { Repository } from '@nocobase/database';

export const createTokenBlacklistService = (
  repo: Repository,
): TokenBlacklistService & {
  deleteExpiredToken(): Promise<any>;
} => {
  return {
    async has(token: string) {
      return !!(await repo.findOne({
        where: {
          token,
        },
      }));
    },
    async add(values) {
      return repo.model.findOrCreate({
        defaults: values,
        where: {
          token: values.token,
        },
      });
    },
    async deleteExpiredToken() {
      return repo.destroy({
        filter: {
          expiration: {
            $dateNotAfter: new Date(),
          },
        },
      });
    },
  };
};
