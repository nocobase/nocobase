import jsonParse from 'json-templates';
import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

const parseValues = (ctx: Context, values: any) => {
  let currentRecord = {};
  const template = jsonParse(values);
  template.parameters.forEach((p) => {
    if (p.key.startsWith('currentRecord.')) {
      const name = p.key.replace('currentRecord.', '');
      currentRecord[name] = ctx.db.sequelize.literal(name);
    }
  });
  const { currentUser } = ctx.state;
  return template({ currentTime: new Date(), currentUser: currentUser.toJSON(), currentRecord });
};

export async function update(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);
  const { parse, forceUpdate, filterByTk, values, whitelist, blacklist, filter, updateAssociationValues } =
    ctx.action.params;
  let updateValues = values;
  if (parse === 'true') {
    updateValues = parseValues(ctx, values);
  }
  ctx.body = await repository.update({
    filterByTk,
    values: updateValues,
    whitelist,
    blacklist,
    filter,
    updateAssociationValues,
    context: ctx,
    forceUpdate,
  });

  await next();
}
