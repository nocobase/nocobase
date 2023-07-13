import { PasswordField } from '@nocobase/database';
import { Context, Next } from '@nocobase/actions';
import { namespace } from '..';

export default async function (ctx: Context, next: Next) {
  const { uniqueField = 'email', values } = ctx.action.params;

  if (!values[uniqueField]) {
    return ctx.throw(400, {
      code: 'InvalidUserData',
      message: ctx.t('Please fill in your email address', { ns: namespace }),
    });
  }
  const User = ctx.db.getCollection('users');
  const user = await User.model.findOne<any>({
    where: {
      [uniqueField]: values[uniqueField],
    },
  });

  if (!user) {
    return ctx.throw(404, ctx.t('The email is incorrect, please re-enter', { ns: namespace }));
  }

  const field = User.getField<PasswordField>('password');
  const valid = await field.verify(values.password, user.password);
  if (!valid) {
    return ctx.throw(404, ctx.t('The password is incorrect, please re-enter', { ns: namespace }));
  }

  ctx.state.currentUser = user;

  return next();
}
