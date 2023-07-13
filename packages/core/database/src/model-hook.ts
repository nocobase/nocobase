import lodash from 'lodash';
import { SequelizeHooks } from 'sequelize/types/hooks';

import Database from './database';
import { Model } from './model';

const { hooks } = require('sequelize/lib/hooks');

export class ModelHook {
  database: Database;

  boundEvents = new Set<string>();

  constructor(database: Database) {
    this.database = database;
  }

  match(event: string | symbol): keyof SequelizeHooks | null {
    // NOTE: skip Symbol event
    if (!lodash.isString(event)) {
      return null;
    }

    const type = event.split('.').pop();

    return type in hooks ? <keyof SequelizeHooks>type : null;
  }

  findModelName(hookArgs) {
    for (const arg of hookArgs) {
      if (arg?._previousDataValues) {
        return (<Model>arg).constructor.name;
      }
      if (lodash.isPlainObject(arg)) {
        if (arg['model']) {
          return arg['model'].name;
        }
        const plural = arg?.name?.plural;
        if (this.database.sequelize.isDefined(plural)) {
          return plural;
        }
        const singular = arg?.name?.singular;
        if (this.database.sequelize.isDefined(singular)) {
          return singular;
        }
      }
    }
    return null;
  }

  bindEvent(type) {
    this.boundEvents.add(type);
  }

  hasBoundEvent(type): boolean {
    return this.boundEvents.has(type);
  }

  buildSequelizeHook(type) {
    return async (...args: any[]) => {
      const modelName = this.findModelName(args);

      if (modelName) {
        // emit model event
        await this.database.emitAsync(`${modelName}.${type}`, ...args);
      }

      // emit sequelize global event
      await this.database.emitAsync(type, ...args);
    };
  }
}
