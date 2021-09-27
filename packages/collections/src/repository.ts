import {
  Op,
  Model,
  ModelCtor,
  Association,
  FindOptions,
  BulkCreateOptions,
  DestroyOptions as SequelizeDestroyOptions,
  CreateOptions as SequelizeCreateOptions,
  UpdateOptions as SequelizeUpdateOptions,
} from 'sequelize';
import { flatten } from 'flat';
import { Collection } from './collection';
import _ from 'lodash';
import { Database } from './database';
import { updateAssociations } from './update-associations';
import { RelationField } from './fields';

export interface IRepository {}

interface CreateManyOptions extends BulkCreateOptions {}

interface FindManyOptions extends FindOptions {
  filter?: any;
  fields?: any;
  appends?: any;
  expect?: any;
  page?: any;
  pageSize?: any;
  sort?: any;
}

interface FindOneOptions extends FindOptions {
  filter?: any;
  fields?: any;
  appends?: any;
  expect?: any;
  sort?: any;
}

interface CreateOptions extends SequelizeCreateOptions {
  values?: any;
  whitelist?: any;
  blacklist?: any;
}

interface UpdateOptions extends SequelizeUpdateOptions {
  values?: any;
  whitelist?: any;
  blacklist?: any;
}

interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: any;
}

interface RelatedQueryOptions {
  database: Database;
  field: RelationField;
  source: {
    idOrInstance: any;
    collection: Collection;
  };
  target: {
    association: Association & {
      accessors: any;
    };
    collection: Collection;
  };
}

type Identity = string | number;

class RelatedQuery {
  options: RelatedQueryOptions;
  sourceInstance: Model;

  constructor(options: RelatedQueryOptions) {
    this.options = options;
  }

  async getSourceInstance() {
    if (this.sourceInstance) {
      return this.sourceInstance;
    }
    const { idOrInstance, collection } = this.options.source;
    if (idOrInstance instanceof Model) {
      return (this.sourceInstance = idOrInstance);
    }
    this.sourceInstance = await collection.model.findByPk(idOrInstance);
    return this.sourceInstance;
  }

  async findMany(options?: any) {
    const { collection } = this.options.target;
    return await collection.repository.findMany(options);
  }

  async findOne(options?: any) {
    const { collection } = this.options.target;
    return await collection.repository.findOne(options);
  }

  async create(values?: any, options?: any) {
    const { association } = this.options.target;
    const createAccessor = association.accessors.create;
    const source = await this.getSourceInstance();
    const instance = await source[createAccessor](values, options);
    if (!instance) {
      return;
    }
    await updateAssociations(instance, values);
    return instance;
  }

  async update(values: any, options?: Identity | Model | UpdateOptions) {
    const { association, collection } = this.options.target;
    if (options instanceof Model) {
      return await collection.repository.update(values, options);
    }
    const { field } = this.options;
    if (field.type === 'hasOne' || field.type === 'belongsTo') {
      const getAccessor = association.accessors.get;
      const source = await this.getSourceInstance();
      const instance = await source[getAccessor]();
      return await collection.repository.update(values, instance);
    }
    // TODO
    return await collection.repository.update(values, options);
  }

  async destroy(options?: any) {
    const { association, collection } = this.options.target;
    const { field } = this.options;
    if (field.type === 'hasOne' || field.type === 'belongsTo') {
      const getAccessor = association.accessors.get;
      const source = await this.getSourceInstance();
      const instance = await source[getAccessor]();
      if (!instance) {
        return;
      }
      return await collection.repository.destroy(instance.id);
    }
    return await collection.repository.destroy(options);
  }

  async set(options?: any) {}

  async add(options?: any) {}

  async remove(options?: any) {}

  async toggle(options?: any) {}

  async sync(options?: any) {}
}

class HasOneQuery extends RelatedQuery {}

class HasManyQuery extends RelatedQuery {}

class BelongsToQuery extends RelatedQuery {}

class BelongsToManyQuery extends RelatedQuery {}

export class Repository implements IRepository {
  database: Database;
  collection: Collection;
  model: ModelCtor<Model>;

  constructor(collection: Collection) {
    this.database = collection.context.database;
    this.collection = collection;
    this.model = collection.model;
  }

  async findMany(options?: FindManyOptions) {
    const model = this.collection.model;
    const opts = {
      subQuery: false,
      ...this.buildQueryOptions(options),
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
      if (ids.length > 0) {
        rows = await model.findAll({
          ...opts,
          where: {
            [model.primaryKeyAttribute]: {
              [Op.in]: ids,
            },
          },
        });
      }
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
    const model = this.collection.model;
    const opts = {
      subQuery: false,
      ...this.buildQueryOptions(options),
    };
    let data: Model;
    if (opts.include) {
      const item = await model.findOne({
        ...opts,
        includeIgnoreAttributes: false,
        attributes: [model.primaryKeyAttribute],
        group: `${model.name}.${model.primaryKeyAttribute}`,
      });
      if (!item) {
        return;
      }
      data = await model.findOne({
        ...opts,
        where: item.toJSON(),
      });
    } else {
      data = await model.findOne({
        ...opts,
      });
    }
    return data;
  }

  async create(values?: any, options?: CreateOptions) {
    const instance = await this.model.create<any>(values, options);
    if (!instance) {
      return;
    }
    await updateAssociations(instance, values, options);
    return instance;
  }

  async createMany(records: any[], options?: CreateManyOptions) {
    const instances = await this.collection.model.bulkCreate(records, options);
    const promises = instances.map((instance, index) => {
      return updateAssociations(instance, records[index]);
    });
    return Promise.all(promises);
  }

  async update(values: any, options: Identity | Model | UpdateOptions) {
    if (options instanceof Model) {
      await options.update(values);
      await updateAssociations(options, values);
      return options;
    }
    let instance: Model;
    if (typeof options === 'string' || typeof options === 'number') {
      instance = await this.model.findByPk(options);
    } else {
      // TODO
      instance = await this.findOne(options);
    }
    await instance.update(values);
    await updateAssociations(instance, values);
    return instance;
  }

  async destroy(options: Identity | Identity[] | DestroyOptions) {
    if (typeof options === 'number' || typeof options === 'string') {
      return await this.model.destroy({
        where: {
          [this.model.primaryKeyAttribute]: options,
        },
      });
    }
    if (Array.isArray(options)) {
      return await this.model.destroy({
        where: {
          [this.model.primaryKeyAttribute]: {
            [Op.in]: options,
          },
        },
      });
    }
    const opts = this.buildQueryOptions(options);
    return await this.model.destroy(opts);
  }

  // TODO
  async sort() {}

  relatedQuery(name: string) {
    return {
      for: (sourceIdOrInstance: any) => {
        const field = this.collection.getField(name) as RelationField;
        const database = this.collection.context.database;
        const collection = database.getCollection(field.target);
        const options: RelatedQueryOptions = {
          field,
          database: database,
          source: {
            collection: this.collection,
            idOrInstance: sourceIdOrInstance,
          },
          target: {
            collection,
            association: this.collection.model.associations[name] as any,
          },
        };
        switch (field.type) {
          case 'hasOne':
            return new HasOneQuery(options);
          case 'hasMany':
            return new HasManyQuery(options);
          case 'belongsTo':
            return new BelongsToQuery(options);
          case 'belongsToMany':
            return new BelongsToManyQuery(options);
        }
      },
    };
  }

  buildQueryOptions(options: any) {
    const opts = this.parseFilter(options.filter);
    return { ...options, ...opts };
  }

  parseFilter(filter?: any) {
    if (!filter) {
      return {};
    }
    const model = this.collection.model;
    if (typeof filter === 'number' || typeof filter === 'string') {
      return {
        where: {
          [model.primaryKeyAttribute]: filter,
        },
      };
    }
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
