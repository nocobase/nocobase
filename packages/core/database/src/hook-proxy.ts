import lodash from 'lodash';
import Database from './database';
import { Model } from './model';
import type { SequelizeHooks } from 'sequelize/types/lib/hooks';

const { hooks: sequelizeHooks } = require('sequelize/lib/hooks');

export const hooks = {
  beforeDefineCollection: { params: 1, sync: true, noModel: true },
  afterDefineCollection: { params: 1, sync: true, noModel: true },
  beforeRemoveCollection: { params: 1, sync: true, noModel: true },
  afterRemoveCollection: { params: 1, sync: true, noModel: true },
  afterCreateWithAssociations: { params: 2 },
  afterUpdateWithAssociations: { params: 2 },
  afterSaveWithAssociations: { params: 2 },
};


export class HookProxy {
  database: Database;
  // e.g.
  // {
  //   [type]: {
  //     // global
  //     '': new Set(),
  //     model: new Set()
  //   }
  // }
  boundEvents = new Set<string>();

  constructor(database: Database) {
    this.database = database;
  }

  // 'afterDefine'
  //   -> ['afterDefine', '']
  // 'afterCreate'
  //   -> ['afterCreate', '']
  // '<collection>.afterCreate'
  //   -> ['afterCreate', '<collection>']
  // '<collection>.afterCreateWithAssociations'
  //   -> ['afterCreateWithAssociations', '<collection>']
  // non-collection hooks
  //   -> null
  match(event: string | Symbol): keyof SequelizeHooks | null {
    // NOTE: skip Symbol event
    if (!lodash.isString(event)) {
      return null;
    }

    const type = event.split('.').pop();

    return type in sequelizeHooks ? <keyof SequelizeHooks>type : null;
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

        if (lodash.get(arg, 'name.plural')) {
          return lodash.get(arg, 'name.plural');
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
      const before = type.startsWith('before');
      if (before) {
        await this.database.emitAsync(type, ...args);
      }

      const modelName = this.findModelName(args);
      if (modelName) {
        // emit model event
        await this.database.emitAsync(`${modelName}.${type}`, ...args);
      }

      if (!before) {
        await this.database.emitAsync(type, ...args);
      }
    };
  }
}
