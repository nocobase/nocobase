import actions, { Context, Next } from '@nocobase/actions';
import { BaseAuth } from '@nocobase/auth';
import { Repository } from '@nocobase/database';

export async function create(ctx: Context, next: Next) {
  const { values } = ctx.action.params;

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
    const token = (ctx.auth as BaseAuth).jwt.sign(
      { userId: ctx.user.id, roleName: role.name },
      { expiresIn: values.expiresIn },
    );

    ctx.body = {
      token,
    };
    await next();
  });
}
