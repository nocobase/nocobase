import lodash from 'lodash';
import Database from './database';
import { Model } from './model';

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

function subsetNotEmpty(set: Map<string, any>): boolean {
  return Boolean(set.size)
    && Array.from(set.values()).some(item => item.size);
}
export class HookProxy {
  database: Database;
  // e.g.
  // {
  //   [type]: {
  //     // global
  //     '': {
  //       '': new Set(),
  //       name1: fn1
  //     },
  //     model: {
  //       // unnamed
  //       '': new Set(),
  //       name1: fn1,
  //       name2: fn2
  //     }
  //   }
  // }
  boundEvents = new Map<string, Map<string, Map<string, Set<Function>>>>();

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
  match(event: string | Symbol): [string, string?] | null {
    // NOTE: skip Symbol event
    if (!lodash.isString(event)) {
      return null;
    }

    const parts = event.split('.');
    const type = parts.pop();

    // NOTE: sequelize non-model events

    // NOTE: global model events
    if (!parts.length) {
      if (!this.isSequelizeHook(type)) {
        return null;
      }

      return [type, ''];
    }

    // NOTE: model events
    // TODO(question): if collection is not defined, should we bind event?
    //   * pros: allow to bind event before collection definition done, especially in some field (context / sort)
    //   * cons: binding will not be so accurate
    if (parts.length === 1) {
      return [type, parts[0]];
    }

    return null;
  }

  isSequelizeHook(type) {
    return type in sequelizeHooks;
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

  bindEvent(type, collection, name, listener) {
    const typeEvents = this.boundEvents.get(type) || new Map();
    this.boundEvents.set(type, typeEvents);

    const collectionEvents = typeEvents.get(collection) || new Map();
    typeEvents.set(collection, collectionEvents);

    const namedEvents = collectionEvents.get(name ?? '') || new Set();
    collectionEvents.set(name ?? '', namedEvents);

    if (!name) {
      namedEvents.add(listener);
    } else {
      collectionEvents.set(name, new Set([listener]));
    }
  }

  unbindEvent(type, collection, name, listener?) {
    const typeEvents = this.boundEvents.get(type);
    if (!typeEvents) {
      return;
    }

    const collectionEvents = typeEvents.get(collection);
    if (!collectionEvents) {
      return;
    }

    if (!listener) {
      collectionEvents.delete(name ?? '');
      return;
    }

    const namedEvents = collectionEvents.get(name ?? '');
    if (!namedEvents) {
      return;
    }

    namedEvents.delete(listener);
  }

  hasBoundEvent(type, collection?, name?): boolean {
    const typeEvents = this.boundEvents.get(type);
    if (!typeEvents || !typeEvents.size) {
      return false;
    }

    if (collection == null) {
      return Array.from(typeEvents.values()).some(subsetNotEmpty)
    }

    const collectionEvents = typeEvents.get(collection);
    if (!collectionEvents) {
      return false;
    }

    if (!name) {
      return subsetNotEmpty(collectionEvents);
    }

    const namedEvents = collectionEvents.get(name);
    return Boolean(namedEvents.size);
  }

  buildSequelizeHook(eventName) {
    return async (...args: any[]) => {
      const before = eventName.startsWith('before');
      if (before) {
        await this.database.emitAsync(eventName, ...args);
      }

      const modelName = this.findModelName(args);
      if (modelName) {
        // emit model event
        await this.database.emitAsync(`${modelName}.${eventName}`, ...args);
      }

      if (!before) {
        await this.database.emitAsync(eventName, ...args);
      }
    };
  }

  getProxyHandler(type, collection) {
    return (...args: any[]) => {
      const typeEvents = this.boundEvents.get(type);
      if (!typeEvents || !typeEvents.size) {
        return;
      }

      const collectionEvents = typeEvents.get(collection);
      if (!collectionEvents || !collectionEvents.size) {
        return;
      }

      const listeners = [];
      for (const eventSet of collectionEvents.values()) {
        listeners.push(...Array.from(eventSet));
      }

      if ((type in sequelizeHooks && sequelizeHooks[type].sync)
        || (type in hooks && hooks[type].sync)) {
        listeners.forEach(listener => listener(...args));
        return;
      }

      return listeners.reduce((promise, listener) => promise.then(() => listener(...args)), Promise.resolve());
    };
  }
}
