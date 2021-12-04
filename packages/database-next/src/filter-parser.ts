import { Model, ModelCtor } from 'sequelize';
import _ from 'lodash';
import { flatten } from 'flat';
import { Database } from './database';
import lodash from 'lodash';

const debug = require('debug')('noco-database');

type FilterType = any;

class FilterParser {
  database: Database;
  model: ModelCtor<Model>;
  filter: FilterType;

  constructor(model: ModelCtor<any>, database: Database, filter: FilterType) {
    this.model = model;
    this.filter = filter;
    this.database = database;
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
            throw new Error(
              `${attr} neither ${firstKey}'s association nor ${firstKey}'s attribute`,
            );
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

      if (
        values &&
        typeof values === 'object' &&
        value &&
        typeof value === 'object'
      ) {
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

export default FilterParser;
