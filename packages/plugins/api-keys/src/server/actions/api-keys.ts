import actions, { Context, Next } from '@nocobase/actions';
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

  return actions.create(ctx, async () => {
    const data = await apiKeysAuth.signIn({
      roleName: values.role.name,
    });
    ctx.body = {
      token: data.token,
    };
    await next();
  });
}
