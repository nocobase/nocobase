import { Model, ModelCtor } from 'sequelize';
import _ from 'lodash';
import { flatten } from 'flat';
import { Collection } from './collection';

type FilterType = any;

class FilterParser {
  model: ModelCtor<Model>;
  collection: Collection;
  filter: FilterType;

  constructor(collection: Collection, filter: FilterType) {
    this.collection = collection;
    this.model = collection.model;
    this.filter = filter;
  }

  toSequelizeParams() {
    if (!this.filter) {
      return {};
    }

    const filter = this.filter;
    const model = this.model;

    // supported operators
    const operators = this.collection.context.database.operators;

    const flattenedFilter = flatten(filter || {});

    const include = {};
    const where = {};
    const filter2 = { ...flattenedFilter };

    let skipPrefix = null;

    const isOperator = (key: string) => {
      return key.startsWith('$') && operators.has(key);
    };

    for (let [key, value] of Object.entries(flattenedFilter)) {
      if (skipPrefix && key.startsWith(skipPrefix)) {
        continue;
      }

      let keys = key.split('.');
      const associations = model.associations;
      const paths = [];
      const origins = [];

      while (keys.length) {
        const firstKey = keys.shift();
        origins.push(firstKey);

        if (firstKey.startsWith('$')) {
          if (operators.has(firstKey)) {
            const opKey = operators.get(firstKey);
            if (typeof opKey === 'symbol') {
              paths.push(opKey);
              continue;
            } else if (typeof opKey === 'function') {
              skipPrefix = origins.join('.');
              value = opKey(_.get(filter2, origins));
              break;
            }
          } else {
            paths.push(firstKey);
            continue;
          }
        }

        if (/\d+/.test(firstKey)) {
          paths.push(firstKey);
          continue;
        }
        if (!associations[firstKey]) {
          paths.push(firstKey);
          continue;
        }

        const associationKeys = [];

        associationKeys.push(firstKey);
        _.set(include, firstKey, {
          association: firstKey,
          attributes: [],
        });
        let target = associations[firstKey].target;
        while (target) {
          const attr = keys.shift();
          if (target.rawAttributes[attr]) {
            associationKeys.push(attr);
            target = null;
          } else if (target.associations[attr]) {
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
          }
        }
        if (associationKeys.length > 1) {
          paths.push(`$${associationKeys.join('.')}$`);
        } else {
          paths.push(firstKey);
        }
      }

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
    return { where, include: toInclude(include) };
  }
}

export default FilterParser;
