import { Utils, Op, Sequelize } from 'sequelize';
import _ from 'lodash';
import { Context, Next } from '..';
import {
  Model,
  HASONE,
  HASMANY,
  BELONGSTO,
  BELONGSTOMANY,
  whereCompare
} from '@nocobase/database';
import { PageParameter } from '@nocobase/resourcer';

async function hasManyGet(instances, options: any = {}) {
  const where = {};

  let Model = this.target;
  Model = Model.database.getModel(Model.name);

  let instance;
  let values;

  if (!Array.isArray(instances)) {
    instance = instances;
    instances = undefined;
  }

  options = { ...options };

  if (this.scope) {
    Object.assign(where, this.scope);
  }

  if (instances) {
    values = instances.map(_instance => _instance.get(this.sourceKey, { raw: true }));

    if (options.limit && instances.length > 1) {
      options.groupedLimit = {
        limit: options.limit,
        on: this, // association
        values
      };

      delete options.limit;
    } else {
      where[this.foreignKey] = {
        [Op.in]: values
      };
      delete options.groupedLimit;
    }
  } else {
    where[this.foreignKey] = instance.get(this.sourceKey, { raw: true });
  }

  options.where = options.where ?
    { [Op.and]: [where, options.where] } :
    where;

  if (Object.prototype.hasOwnProperty.call(options, 'scope')) {
    if (!options.scope) {
      Model = Model.unscoped();
    } else {
      Model = Model.scope(options.scope);
    }
  }

  if (Object.prototype.hasOwnProperty.call(options, 'schema')) {
    Model = Model.schema(options.schema, options.schemaDelimiter);
  }

  const results = await Model.findAndCountAll(options);
  if (instance) return results;

  const result = {};
  for (const _instance of instances) {
    result[_instance.get(this.sourceKey, { raw: true })] = [];
  }

  for (const _instance of results) {
    result[_instance.get(this.foreignKey, { raw: true })].push(_instance);
  }

  return result;
}

async function belongsToManyGet(instance, options) {
  options = Utils.cloneDeep(options) || {};

  const through = this.through;
  let scopeWhere;
  let throughWhere;

  if (this.scope) {
    scopeWhere = { ...this.scope };
  }

  options.where = {
    [Op.and]: [
      scopeWhere,
      options.where
    ]
  };

  if (Object(through.model) === through.model) {
    throughWhere = {};
    throughWhere[this.foreignKey] = instance.get(this.sourceKey);

    if (through.scope) {
      Object.assign(throughWhere, through.scope);
    }

    //If a user pass a where on the options through options, make an "and" with the current throughWhere
    if (options.through && options.through.where) {
      throughWhere = {
        [Op.and]: [throughWhere, options.through.where]
      };
    }

    options.include = options.include || [];
    options.include.push({
      association: this.oneFromTarget,
      attributes: options.joinTableAttributes,
      required: true,
      paranoid: _.get(options.through, 'paranoid', true),
      where: throughWhere
    });
  }

  let model = this.target;
  if (Object.prototype.hasOwnProperty.call(options, 'scope')) {
    if (!options.scope) {
      model = model.unscoped();
    } else {
      model = model.scope(options.scope);
    }
  }

  if (Object.prototype.hasOwnProperty.call(options, 'schema')) {
    model = model.schema(options.schema, options.schemaDelimiter);
  }

  return model.findAndCountAll(options);
}

/**
 * 查询数据列表
 *
 * - Signle
 * - HasMany
 * - BelongsToMany
 * 
 * HasOne 和 belongsTo 不涉及到 list
 *
 * @param ctx 
 * @param next 
 */
export async function list(ctx: Context, next: Next) {
  const {
    page = PageParameter.DEFAULT_PAGE,
    perPage = PageParameter.DEFAULT_PER_PAGE,
    sort = [],
    fields = [],
    appends = [],
    except = [],
    filter = {},
    associated,
    associatedName,
    resourceName,
    resourceField,
  } = ctx.action.params;
  let data = {};
  let options: any = {};
  let Model;
  if (associated && resourceField) {
    const AssociatedModel = ctx.db.getModel(associatedName);
    Model = ctx.db.getModel(resourceField.options.target);
    options = Model.parseApiJson({
      sort,
      page,
      perPage,
      filter,
      fields,
      appends,
      except,
      context: ctx,
    });
    if (!(associated instanceof AssociatedModel)) {
      throw new Error(`${associatedName} associated model invalid`);
    }
    // const getAccessor = resourceField.getAccessors().get;
    // const countAccessor = resourceField.getAccessors().count;
    options.scope = options.scopes || [];
    const association = AssociatedModel.associations[resourceField.options.name];
    if (resourceField instanceof BELONGSTOMANY) {
      data = await belongsToManyGet.call(association, associated, {
        joinTableAttributes: [],
        ...options,
        context: ctx,
      });
    }
    if (resourceField instanceof HASMANY) {
      data = await hasManyGet.call(association, associated, {
        joinTableAttributes: [],
        ...options,
        context: ctx,
      });
    }
  } else {
    Model = ctx.db.getModel(resourceName);
    options = Model.parseApiJson({
      sort,
      page,
      perPage,
      filter,
      fields,
      appends,
      except,
      context: ctx,
    });
    data = await Model.scope(options.scopes || []).findAndCountAll({
      ...options,
      // @ts-ignore hooks 里添加 context
      context: ctx,
    });
  }
  if (options.limit || typeof options.offset !== 'undefined') {
    // Math.round 避免精度问题
    data['page'] = Math.round((options.offset || 0) / options.limit + 1);
    data[Utils.underscoredIf('perPage', Model.options.underscored)] = options.limit;
  }
  ctx.body = data;
  await next();
}

export default list;
