import {
  ModelCtor,
  Model,
  BulkCreateOptions,
  FindOptions,
  Op,
} from 'sequelize';
import { flatten } from 'flat';
import { Collection } from './collection';
import _ from 'lodash';
import { Database } from './database';
import { updateAssociations } from './update-associations';

export interface IRepository {}

interface FindAllOptions extends FindOptions {
  filter?: any;
  fields?: any;
  page?: any;
  pageSize?: any;
  sort?: any;
}

interface FindOneOptions extends FindOptions {
  filter?: any;
  fields?: any;
  sort?: any;
}

export class Repository implements IRepository {
  collection: Collection;
  database: Database;

  constructor(collection: Collection) {
    this.database = collection.context.database;
    this.collection = collection;
  }

  async findAll(options?: FindAllOptions) {
    const model = this.collection.model;
    const opts = {
      subQuery: false,
      ...this.parseApiJson(options),
    };
    let rows = [];
    if (opts.include) {
      const ids = (
        await model.findAll({
          ...opts,
          includeIgnoreAttributes: false,
          attributes: [model.primaryKeyAttribute],
          group: `${model.name}.${model.primaryKeyAttribute}`,
        })
      ).map((item) => item[model.primaryKeyAttribute]);
      rows = await model.findAll({
        ...opts,
        where: {
          [model.primaryKeyAttribute]: {
            [Op.in]: ids,
          },
        },
      });
    } else {
      rows = await model.findAll({
        ...opts,
      });
    }
    const count = await model.count({
      ...opts,
      distinct: opts.include ? true : undefined,
    });
    return { count, rows };
  }

  async findOne(options?: FindOneOptions) {
    const opts = this.parseApiJson(options);
    console.log({ opts });
    const data = await this.collection.model.findOne(opts);
    return data;
  }

  create() {}

  update() {}

  destroy() {}

  async bulkCreate(records: any[], options?: BulkCreateOptions) {
    const instances = await this.collection.model.bulkCreate(records, options);
    const promises = instances.map((instance, index) => {
      return updateAssociations(instance, records[index]);
    });
    return Promise.all(promises);
  }

  parseApiJson(options: any) {
    const filter = options.filter || {};
    const model = this.collection.model;
    const operators = this.database.operators;
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
    console.log(JSON.stringify({ include: toInclude(include) }, null, 2));
    return { ...options, where, include: toInclude(include) };
  }
}
