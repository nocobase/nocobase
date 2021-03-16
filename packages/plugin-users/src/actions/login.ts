import { actions } from '@nocobase/actions';
import { PASSWORD } from '@nocobase/database';
import cryptoRandomString from 'crypto-random-string';

export default async (ctx: actions.Context, next: actions.Next) => {
  const { uniqueField = 'email', values } = ctx.action.params;
  // console.log(values);
  const User = ctx.db.getModel('users');
  const user = await User.findOne({
    where: {
      [uniqueField]: values[uniqueField],
    },
  });
  if (!user) {
    ctx.throw(401, 'Unauthorized');
  }
  if (!PASSWORD.verify(values.password, user.password)) {
    ctx.throw(401, 'Unauthorized');
  }
  if (!user.token) {
    user.token = cryptoRandomString({length: 20});
    await user.save();
  }
  ctx.body = {
    data: user,
  };
  await next();
}