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

    if (typeof filter === 'number' || typeof filter === 'string') {
      return {
        where: {
          [model.primaryKeyAttribute]: filter,
        },
      };
    }

    const operators = this.collection.context.database.operators;

    const obj = flatten(filter || {});
    const include = {};
    const where = {};
    let skipPrefix = null;
    const filter2 = {};
    for (const [key, value] of Object.entries(obj)) {
      _.set(filter2, key, value);
    }
    for (let [key, value] of Object.entries(obj)) {
      if (skipPrefix && key.startsWith(skipPrefix)) {
        continue;
      }
      let keys = key.split('.');
      const associations = model.associations;
      const paths = [];
      const origins = [];
      while (keys.length) {
        const k = keys.shift();
        origins.push(k);
        if (k.startsWith('$')) {
          if (operators.has(k)) {
            const opKey = operators.get(k);
            if (typeof opKey === 'symbol') {
              paths.push(opKey);
              continue;
            } else if (typeof opKey === 'function') {
              skipPrefix = origins.join('.');
              // console.log({ skipPrefix }, filter2, _.get(filter2, origins));
              value = opKey(_.get(filter2, origins));
              break;
            }
          } else {
            paths.push(k);
            continue;
          }
        }
        if (/\d+/.test(k)) {
          paths.push(k);
          continue;
        }
        if (!associations[k]) {
          paths.push(k);
          continue;
        }
        const associationKeys = [];
        associationKeys.push(k);
        _.set(include, k, {
          association: k,
          attributes: [],
        });
        let target = associations[k].target;
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
          paths.push(k);
        }
      }
      console.log(paths, value);
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
