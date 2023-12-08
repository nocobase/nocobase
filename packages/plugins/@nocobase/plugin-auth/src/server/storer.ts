import { Storer as IStorer } from '@nocobase/auth';
import { Cache } from '@nocobase/cache';
import { Database, Model } from '@nocobase/database';
import { AuthModel } from './model/authenticator';

export class Storer implements IStorer {
  db: Database;
  cache: Cache;
  key = 'authenticators';

  constructor({ db, cache }: { db: Database; cache: Cache }) {
    this.db = db;
    this.cache = cache;

    this.db.on('authenticators.afterSave', async (model: AuthModel) => {
      if (!model.enabled) {
        await this.cache.delValueInObject(this.key, model.name);
        return;
      }
      await this.cache.setValueInObject(this.key, model.name, model);
    });
    this.db.on('authenticators.afterDestroy', async (model: AuthModel) => {
      await this.cache.delValueInObject(this.key, model.name);
    });
  }

  async getCache(): Promise<AuthModel[]> {
    const authenticators = (await this.cache.get(this.key)) as Record<string, AuthModel>;
    if (!authenticators) {
      return [];
    }
    return Object.values(authenticators);
  }

  async setCache(authenticators: AuthModel[]) {
    const obj = authenticators.reduce((obj, authenticator) => {
      obj[authenticator.name] = authenticator;
      return obj;
    }, {});
    await this.cache.set(this.key, obj);
  }

  async get(name: string) {
    let authenticators = await this.getCache();
    if (!authenticators.length) {
      const repo = this.db.getRepository('authenticators');
      authenticators = await repo.find({ filter: { enabled: true } });
      await this.setCache(authenticators);
    }
    const authenticator = authenticators.find((authenticator: Model) => authenticator.name === name);
    return authenticator || authenticators[0];
  }
}
