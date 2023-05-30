import { Context, Next } from '@nocobase/actions';

export const query = async (ctx: Context, next: Next) => {
  const { collection, measures, dimensions, orders, filter, limit } = ctx.action.params.values || {};
  const { sequelize } = ctx.db;
  const repository = ctx.db.getRepository(collection);
  const attributes = [];
  const group = [];
  const order = [];
  measures.forEach((item: { field: string; aggregation: string; alias: string }) => {
    const attribute = [];
    const col = sequelize.col(item.field);
    if (item.aggregation) {
      attribute.push(sequelize.fn(item.aggregation, col));
    } else {
      attribute.push(item.field);
    }
    if (item.alias) {
      attribute.push(item.alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
  });
  dimensions.forEach((item: { field: string; format: string; alias: string }) => {
    const attribute = [];
    const col = sequelize.col(item.field);
    if (item.format) {
      attribute.push(sequelize.fn(item.format, col));
    } else {
      attribute.push(item.field);
    }
    if (item.alias) {
      attribute.push(item.alias);
    }
    attributes.push(attribute.length > 1 ? attribute : attribute[0]);
    group.push(attribute.length > 1 ? attribute[1] : attribute[0]);
  });
  orders?.forEach((item: { field: string; order: string }) => {
    order.push([item.field, item.order]);
  });
  console.log(attributes);
  ctx.body = await repository.find({
    attributes,
    group,
    filter,
    order,
    limit,
  });

  await next();
};
