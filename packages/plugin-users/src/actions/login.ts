import { actions } from '@nocobase/actions';
import cryptoRandomString from 'crypto-random-string';
import { Password } from "@nocobase/database";

export default async (ctx: actions.Context, next: actions.Next) => {
  const { values } = ctx.action.params;
  // console.log(values);
  const User = ctx.db.getModel('users');
  const user = await User.findOne({
    where: {
      username: values.username,
    },
  });
  if (!user) {
    ctx.throw(401, 'Unauthorized');
  }
  if (!Password.verify(values.password, user.password)) {
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