import { Model, ModelCtor } from '@nocobase/database';
import { actions, middlewares } from '@nocobase/actions';
import { sort } from '@nocobase/actions/src/actions/common';
import { cloneDeep, omit } from 'lodash';

export const findAll = async (ctx: actions.Context, next: actions.Next) => {
  const Collection = ctx.db.getModel('collections');
  const collections = await Collection.findAll(Collection.parseApiJson({
    sort: 'sort',
  }));
  const data = [];
  for (const collection of collections) {
    data.push(await collection.toProps());
  }
  ctx.body = data;
  await next();
}

export const createOrUpdate = async (ctx: actions.Context, next: actions.Next) => {
  const { values } = ctx.action.params;
  const Collection = ctx.db.getModel('collections');
  let collection;
  if (values.name) {
    collection = await Collection.findByPk(values.name);
  }
  try {
    if (!collection) {
      collection = await Collection.create(values);
    } else {
      await collection.update(values);
    }
    if (values.generalFields) {
      values.generalFields = values.generalFields.map((field, index) => {
        return {
          ...field,
          sort: index + 1,
        }
      })
    }
    await collection.updateAssociations(values);
    await collection.migrate();
  } catch (error) {
    // console.log('error.errors', error.errors)
    throw error;
  }
  ctx.body = collection;
}
