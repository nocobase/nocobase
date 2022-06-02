import lodash from 'lodash';
import type { SequelizeHooks } from 'sequelize/types/lib/hooks';
import Database from './database';
import { Model } from './model';

const { hooks } = require('sequelize/lib/hooks');

export class ModelHook {
  database: Database;
  boundEvent = new Set<string>();

  constructor(database: Database) {
    this.database = database;
  }

  isModelHook(eventName: string | symbol): keyof SequelizeHooks | false {
    if (lodash.isString(eventName)) {
      const hookType = eventName.split('.').pop();

      if (hooks[hookType]) {
        return <keyof SequelizeHooks>hookType;
      }
    }

    return false;
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

  bindEvent(eventName) {
    this.boundEvent.add(eventName);
  }

  hasBindEvent(eventName) {
    return this.boundEvent.has(eventName);
  }

  sequelizeHookBuilder(eventName) {
    return async (...args: any[]) => {
      const modelName = this.findModelName(args);

      if (modelName) {
        // emit model event
        await this.database.emitAsync(`${modelName}.${eventName}`, ...args);
      }

      // emit sequelize global event
      await this.database.emitAsync(eventName, ...args);
    };
  }
}
