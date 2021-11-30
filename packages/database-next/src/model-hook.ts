import Database from './database';
import lodash from 'lodash';
import { Model } from 'sequelize';

const { hooks } = require('sequelize/lib/hooks');

export class ModelHook {
  database: Database;
  boundEvent = new Set<string>();

  constructor(database: Database) {
    this.database = database;
  }

  isModelHook(eventName: string | symbol) {
    if (lodash.isString(eventName)) {
      const hookType = eventName.split('.').pop();

      if (hooks[hookType]) {
        return hookType;
      }
    }

    return false;
  }

  findModelName(hookArgs) {
    for (const arg of hookArgs) {
      if (arg instanceof Model) {
        return (<Model>arg).constructor.name;
      }

      if (lodash.isPlainObject(arg) && arg['model']) {
        return arg['model'].name;
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
