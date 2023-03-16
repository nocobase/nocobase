import { Op, PasswordField } from '@nocobase/database';
import { Context, Next } from '@nocobase/actions';
import { namespace } from '..';

export default async function (ctx: Context, next: Next) {
  const { values } = ctx.action.params;
  const account = values?.account
  if (!account) {
    return ctx.throw(400, { code: 'InvalidUserData', message: ctx.t('Please fill in your account', { ns: namespace }) });
  }
  const User = ctx.db.getCollection('users');
  const user = await User.model.findOne<any>({
    where: {
      [Op.or]: {
        email: account,
        phone: account,
        account: account,
      }
    },
  });

  if (!user) {
    return ctx.throw(404, ctx.t('The account is incorrect, please re-enter', { ns: namespace }));
  }

  const field = User.getField<PasswordField>('password');
  const valid = await field.verify(values.password, user.password);
  if (!valid) {
    return ctx.throw(404, ctx.t('The password is incorrect, please re-enter', { ns: namespace }));
  }

  ctx.state.currentUser = user;

  return next();
}
