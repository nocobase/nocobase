import { Context } from '@nocobase/actions';
import { Collection } from '@nocobase/database';

export const dateTemplate = async (ctx: Context, next) => {
  const { resourceName, actionName } = ctx.action;
  const { isTemplate, fields } = ctx.action.params;

  await next();

  if (isTemplate && actionName === 'get' && fields.length > 0) {
    ctx.body = traverseJSON(ctx.body?.toJSON(), ctx.db.getCollection(resourceName));
  }
};

const traverseHasMany = (arr: any[], collection: Collection, exclude = []) => {
  if (!arr) {
    return arr;
  }
  return arr.map((item) => traverseJSON(item, collection, exclude));
};

const traverseBelongsToMany = (arr: any[], collection: Collection, exclude = [], through) => {
  if (!arr) {
    return arr;
  }
  const throughCollection = collection.db.getCollection(through);
  return arr.map((item) => {
    const data = traverseJSON(item[through], throughCollection, exclude);
    if (Object.keys(data).length) {
      item[through] = data;
    } else {
      delete item[through];
    }
    return item;
  });
};

const traverseJSON = (data, collection: Collection, exclude = []) => {
  const result = {};
  for (const key of Object.keys(data)) {
    if (exclude.includes(key)) {
      continue;
    }
    if (['createdAt', 'updatedAt', 'createdBy', 'createdById', 'updatedById', 'updatedBy'].includes(key)) {
      continue;
    }
    const field = collection.getField(key);
    if (!field) {
      result[key] = data[key];
      continue;
    }
    if (field.options.primaryKey) {
      continue;
    }
    if (field.type === 'sort') {
      continue;
    }
    if (field.type === 'hasOne') {
      result[key] = traverseJSON(data[key], collection.db.getCollection(field.target), [field.foreignKey]);
    } else if (field.type === 'hasMany') {
      result[key] = traverseHasMany(data[key], collection.db.getCollection(field.target), [field.foreignKey]);
    } else if (field.type === 'belongsTo') {
      result[key] = data[key];
    } else if (field.type === 'belongsToMany') {
      result[key] = traverseBelongsToMany(
        data[key],
        collection.db.getCollection(field.target),
        [field.foreignKey, field.otherKey],
        field.through,
      );
    } else {
      result[key] = data[key];
    }
  }
  return result;
};
