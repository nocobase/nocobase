import { Context, Next } from '@nocobase/actions';
import { formatter } from './formatter';
import { FilterParser } from '@nocobase/database';

export const query = async (ctx: Context, next: Next) => {
  const { collection, measures, dimensions, orders, filter, limit } = ctx.action.params.values || {};
  const { sequelize } = ctx.db;
  const repository = ctx.db.getRepository(collection);
  const fields = repository.collection.fields;
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
    const type = fields.get(item.field).type;
    const attribute = [];
    if (item.format) {
      attribute.push(formatter(sequelize, type, item.field, item.format));
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
    order.push([item.field, item.order || 'ASC']);
  });

  const filterParser = new FilterParser(filter, {
    collection: repository.collection,
  });

  ctx.body = await repository.find({
    attributes,
    group,
    order,
    limit: limit > 2000 ? 2000 : limit,
    ...filterParser.toSequelizeParams(),
  });

  await next();
};
