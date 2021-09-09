import { actions, Context, Next } from '@nocobase/actions';

export const findAll = async (ctx: Context, next: Next) => {
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

export const createOrUpdate = async (ctx: Context, next: Next) => {
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

    const fields = await collection.getGeneralFields({
      where: {
        interface: 'linkTo',
      }
    });

    for (const field of fields) {
      await field.generateReverseField();
    }

    await collection.migrate();
  } catch (error) {
    // console.log('error.errors', error.errors)
    throw error;
  }
  ctx.body = collection;
  await next();
}
