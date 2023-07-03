import { Repository } from '@nocobase/database';

export const createTokenBlacklistService = (repo: Repository) => {
  return {
    async has(token: string) {
      return !!(await repo.findOne({
        where: {
          token,
        },
      }));
    },
    async set(values: { token: string; expiration: string }) {
      return repo.create({
        values: {
          ...values,
        },
      });
    },
  };
};
