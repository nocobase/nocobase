import { Model, ModelCtor } from 'sequelize';
import _ from 'lodash';
import { flatten, unflatten } from 'flat';
import { Database } from './database';
import lodash from 'lodash';
import { Collection } from './collection';

const debug = require('debug')('noco-database');

type FilterType = any;

interface FilterParserContext {
  collection: Collection;
}

export default class FilterParser {
  collection: Collection;
  database: Database;
  model: ModelCtor<Model>;
  filter: FilterType;
  context: FilterParserContext;

  constructor(filter: FilterType, context: FilterParserContext) {
    const { collection } = context;
    this.collection = collection;
    this.context = context;
    this.model = collection.model;
    this.filter = this.prepareFilter(filter);
    this.database = collection.context.database;
  }

  prepareFilter(filter: FilterType) {
    if (lodash.isPlainObject(filter)) {
      const renamedKey = {};

      for (const key of Object.keys(filter)) {
        if (key.endsWith('.$exists') || key.endsWith('.$notExists')) {
          const keyArr = key.split('.');
          if (keyArr[keyArr.length - 2] == 'id') {
            continue;
          }

          keyArr.splice(keyArr.length - 1, 0, 'id');
          renamedKey[key] = keyArr.join('.');
        }
      }

      for (const [oldKey, newKey] of Object.entries(renamedKey)) {
        // @ts-ignore
        filter[newKey] = filter[oldKey];
        delete filter[oldKey];
      }
    }

    return filter;
  }

  toSequelizeParams() {
    debug('filter %o', this.filter);

    if (!this.filter) {
      return {};
    }

    const filter = this.filter;

    const model = this.model;

    // supported operators
    const operators = this.database.operators;

    const originalFiler = lodash.cloneDeep(filter || {});

    const flattenedFilter = flatten(filter || {});

    debug('flattened filter %o', flattenedFilter);

    const include = {};
    const where = {};
    const filter2 = lodash.cloneDeep(flattenedFilter);

    let skipPrefix = null;
    const associations = model.associations;
    debug('associations %O', associations);

    for (let [key, value] of Object.entries(flattenedFilter)) {
      // 处理 filter 条件
      if (skipPrefix && key.startsWith(skipPrefix)) {
        continue;
      }

      debug('handle filter key "%s: "%s"', key, value);
      let keys = key.split('.');

      // paths ?
      const paths = [];

      // origins ?
      const origins = [];

      while (keys.length) {
        debug('keys: %o, paths: %o, origins: %o', keys, paths, origins);

        // move key from keys to origins
        const firstKey = keys.shift();
        origins.push(firstKey);

        debug('origins: %o', origins);

        if (firstKey.startsWith('$')) {
          if (operators.has(firstKey)) {
            debug('%s is operator', firstKey);
            // if firstKey is operator
            const opKey = operators.get(firstKey);
            debug('operator key %s, operator: %o', firstKey, opKey);

            // 默认操作符
            if (typeof opKey === 'symbol') {
              paths.push(opKey);
              continue;
            } else if (typeof opKey === 'function') {
              skipPrefix = origins.join('.');

              value = opKey(originalFiler[skipPrefix], {
                db: this.database,
                path: skipPrefix,
                fieldName: skipPrefix.replace(`.${firstKey}`, ''),
                model: this.model,
              });
              break;
            }
          } else {
            paths.push(firstKey);
            continue;
          }
        }

        // firstKey is number
        if (/\d+/.test(firstKey)) {
          paths.push(firstKey);
          continue;
        }

        // firstKey is not association
        if (!associations[firstKey]) {
          paths.push(firstKey);
          continue;
        }

        const associationKeys = [];

        associationKeys.push(firstKey);

        debug('associationKeys %o', associationKeys);

        // set sequelize include option
        _.set(include, firstKey, {
          association: firstKey,
          attributes: [], // out put empty fields by default
        });

        // association target model
        let target = associations[firstKey].target;
        debug('association target %o', target);

        while (target) {
          const attr = keys.shift();
          origins.push(attr);
          // if it is target model attribute
          if (target.rawAttributes[attr]) {
            associationKeys.push(attr);
            target = null;
          } else if (target.associations[attr]) {
            // if it is target model association (nested association filter)
            associationKeys.push(attr);
            const assoc = [];
            associationKeys.forEach((associationKey, index) => {
              if (index > 0) {
                assoc.push('include');
              }
              assoc.push(associationKey);
            });
            _.set(include, assoc, {
              association: attr,
              attributes: [],
            });
            target = target.associations[attr].target;
          } else {
            throw new Error(`${attr} neither ${firstKey}'s association nor ${firstKey}'s attribute`);
          }
        }

        debug('associationKeys %o', associationKeys);

        if (associationKeys.length > 1) {
          paths.push(`$${associationKeys.join('.')}$`);
        } else {
          paths.push(firstKey);
        }
      }

      debug('where %o, paths %o, value, %o', where, paths, value);

      const values = _.get(where, paths);

      if (values && typeof values === 'object' && value && typeof value === 'object') {
        value = { ...value, ...values };
      }
      _.set(where, paths, value);
    }

    const toInclude = (items) => {
      return Object.values(items).map((item: any) => {
        if (item.include) {
          item.include = toInclude(item.include);
        }
        return item;
      });
    };
    debug('where %o, include %o', where, include);
    return { where, include: toInclude(include) };
  }
}
