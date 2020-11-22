import { Op, Utils, Sequelize } from 'sequelize';
import Model, { ModelCtor } from './model';
import _ from 'lodash';

const op = new Map();

for (const key in Op) {
  op.set(key, Op[key]);
  const val = Utils.underscoredIf(key, true);
  op.set(val, Op[key]);
  op.set(val.replace(/_/g, ''), Op[key]);
}

interface ToWhereContext {
  model?: ModelCtor<Model> | Model | typeof Model;
  associations?: any;
  dialect?: string;
  ctx?: any;
}

export function toWhere(options: any, context: ToWhereContext = {}) {
  if (options === null || typeof options !== 'object') {
    return options;
  }
  if (Array.isArray(options)) {
    return options.map((item) => toWhere(item, context));
  }
  const { model, associations = {}, ctx, dialect } = context;
  const items = {};
  // 先处理「点号」的问题
  for (const key in options) {
    _.set(items, key, options[key]);
  }
  const values = {};
  for (const key in items) {
    if (associations[key]) {
      values['$__include'] = values['$__include'] || {}
      values['$__include'][key] = toWhere(items[key], {
        ...context,
        model: associations[key].target,
        associations: associations[key].target.associations,
      });
    }
    else if (model && model.options.scopes && model.options.scopes[key]) {
      values['$__scopes'] = values['$__scopes'] || [];
      const scope = model.options.scopes[key];
      if (typeof scope === 'function') {
        values['$__scopes'].push({ method: [key, items[key], ctx] });
      } else {
        values['$__scopes'].push(key);
      }
    }
    else {
      // TODO: to fix same op key as field name
      values[op.has(key) ? op.get(key) : key] = toWhere(items[key], context);
    }
  }
  return values;
}

interface ToIncludeContext {
  model?: ModelCtor<Model> | Model | typeof Model;
  sourceAlias?: string;
  associations?: any;
  dialect?: string;
  ctx?: any
}

export function toInclude(options: any, context: ToIncludeContext = {}) {
  const { fields = [] } = options;
  const { model, sourceAlias, associations = {}, ctx, dialect } = context;

  let where = options.where || {};

  if (options.filter) {
    where = toWhere(options.filter, {
      model,
      associations,
      ctx,
    }) || {};
  }

  const includeWhere = Utils.cloneDeep(where.$__include||{});
  const scopes = Utils.cloneDeep(where.$__scopes||[]);

  delete where.$__include;
  delete where.$__scopes;

  const attributes = {
    only: [],
    except: [],
    appends: [],
  };

  const include = new Map();
  const children = new Map();

  const items = Array.isArray(fields) ? { only: fields } : fields;
  items.appends = items.appends || [];

  let sort = options.sort;

  if (sort && typeof sort === 'string') {
    sort = sort.split(',');
  }

  const order = [];

  if (Array.isArray(sort) && sort.length > 0) {
    sort.forEach(key => {
      if (Array.isArray(key)) {
        order.push(key);
      } else {
        const direction = key[0] === '-' ? 'DESC' : 'ASC';
        const keys = key.replace(/^-/, '').split('.');
        const field = keys.pop();
        const by = [];
        let associationModel = model;
        for (let i = 0; i < keys.length; i++) {
          const association = model.associations[keys[i]];
          if (association && association.target) {
            associationModel = association.target;
            by.push(associationModel);
          }
        }
        order.push([...by, field, direction]);
      }
    });
  }

  if (Array.isArray(items.only) && items.only.length > 0) {
    items.only.forEach(field => {
      const arr: Array<string> = Array.isArray(field) ? Utils.cloneDeep(field) : field.split('.');
      const col = arr.shift();
      // 内嵌的情况
      if (arr.length > 0) {
        if (!children.has(col)) {
          children.set(col, {
            fields: {
              only: [arr],
              except: [],
              appends: [],
            },
          });
        } else {
          children.get(col).fields.only.push(arr);
        }
        return;
      }
      // 关系字段
      if (associations[col]) {
        const includeItem: any = {
          association: col,
        };
        if (includeWhere[col]) {
          includeItem.where = includeWhere[col];
        }
        include.set(col, includeItem);
        return;
      }
      const matches: Array<any> = /(.+)_count$/.exec(col);
      if (matches && associations[matches[1]]) {
        attributes.only.push(model.withCountAttribute({
          association: matches[1],
          sourceAlias: sourceAlias
        }));
      } else {
        attributes.only.push(col);
      }
    });
  }

  if (Array.isArray(items.appends) && items.appends.length > 0) {
    items.appends.forEach(field => {
      const arr: Array<string> = Array.isArray(field) ? Utils.cloneDeep(field) : field.split('.');
      const col = arr.shift();
      // 内嵌的情况
      if (arr.length > 0) {
        if (!children.has(col)) {
          children.set(col, {
            fields: {
              only: [],
              except: [],
              appends: [arr],
            },
          });
        } else {
          children.get(col).fields.appends.push(arr);
        }
        return;
      }
      // 关系字段
      if (associations[col]) {
        const includeItem: any = {
          association: col,
        };
        if (includeWhere[col]) {
          includeItem.where = includeWhere[col];
        }
        include.set(col, includeItem);
        return;
      }
      const matches: Array<any> = /(.+)_count$/.exec(col);
      if (matches && associations[matches[1]]) {
        attributes.appends.push(model.withCountAttribute({
          association: matches[1],
          sourceAlias: sourceAlias
        }));
      } else {
        attributes.appends.push(col);
      }
    });
  }

  if (Array.isArray(items.except) && items.except.length > 0) {
    items.except.forEach(field => {
      const arr: Array<string> = Array.isArray(field) ? Utils.cloneDeep(field) : field.split('.');
      const col = arr.shift();
      // 内嵌的情况
      if (arr.length > 0) {
        if (!children.has(col)) {
          children.set(col, {
            where: includeWhere[col],
            fields: {
              only: [],
              except: [arr],
              appends: [],
            },
          });
        } else {
          children.get(col).fields.except.push(arr);
        }
        return;
      }
      // 黑名单里只有字段
      attributes.except.push(col);
    });
  }

  for (const whereKey in includeWhere) {
    if (children.has(whereKey)) {
      children.get(whereKey).where = includeWhere[whereKey];
    } else {
      children.set(whereKey, {
        association: whereKey,
        fields: [],
        where: includeWhere[whereKey],
      });
    }
  }

  for (const [key, child] of children) {
    const result = toInclude(child, {
      ...context,
      model: associations[key].target,
      sourceAlias: key,
      associations: associations[key].target.associations,
    });
    const item: any = {
      association: key,
    }
    if (result.attributes) {
      item.attributes = result.attributes;
    }
    if (result.include) {
      item.include = result.include;
    }
    if (result.where) {
      item.where = result.where;
    }
    if (result.scopes) {
      item.model = associations[key].target.scope(result.scopes);
    }
    include.set(key, item);
  }

  const data:any = {};

  // 存在黑名单时
  if (attributes.except.length > 0) {
    data.attributes = {
      include: attributes.appends,
      exclude: attributes.except,
    };
  }
  // 存在白名单时
  else if (attributes.only.length > 0) {
    data.attributes = [...attributes.only, ...attributes.appends];
  }
  // 只有附加字段时
  else if (attributes.appends.length > 0) {
    data.attributes = {
      include: attributes.appends,
    };
  }

  if (include.size > 0) {
    if (!data.attributes) {
      data.attributes = [];
    }
    data.include = Array.from(include.values());
  }

  if (Object.keys(where).length > 0) {
    data.where = where;
  }

  if (scopes.length > 0) {
    data.scopes = scopes;
  }

  if (order.length > 0) {
    data.order = order;
  }

  return data;
}

export function requireModule(module: any) {
  if (typeof module === 'string') {
    module = require(module);
  }
  if (typeof module !== 'object') {
    return module;
  }
  return module.__esModule ? module.default : module;
}
