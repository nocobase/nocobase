import actions, { Context, Next } from '@nocobase/actions';
import { Repository } from '@nocobase/database';
import { ApiKeysAuth } from '../api-keys-auth';

export async function create(ctx: Context, next: Next) {
  const { values } = ctx.action.params;
  const apiKeysAuth = new ApiKeysAuth({
    ctx,
    options: {
      jwt: {
        expiresIn: values.expiresIn,
      },
    },
  });

  if (!values.role) {
    return;
  }

  const repository = ctx.db.getRepository('users.roles', ctx.state.currentUser.id) as unknown as Repository;
  const role = await repository.findOne({
    filter: {
      name: values.role.name,
    },
  });
  if (!role) {
    throw ctx.throw(400, ctx.t('Role not found'));
  }

  return actions.create(ctx, async () => {
    const data = await apiKeysAuth.signIn({
      roleName: role.name,
    });
    ctx.body = {
      token: data.token,
    };
    await next();
  });
}

export async function list(ctx: Context, next: Next) {
  ctx.action.params.filter = { $and: [{ createdBy: { id: { $eq: ctx.auth.user.id } } }] };
  return actions.list(ctx, next);
}

export async function destroy(ctx: Context, next: Next) {
  ctx.action.params.filter = { $and: [{ createdBy: { id: { $eq: ctx.auth.user.id } } }] };
  return actions.destroy(ctx, next);
}
