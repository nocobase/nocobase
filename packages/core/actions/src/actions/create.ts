import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

export async function create(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);
  const { whitelist, blacklist, updateAssociationValues, values } = ctx.action.params;

  const transaction = await ctx.db.sequelize.transaction();

  try {
    const instance = await repository.create({
      values,
      whitelist,
      blacklist,
      updateAssociationValues,
      context: ctx,
      transaction,
    });
    ctx.body = instance;
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await next();
}
