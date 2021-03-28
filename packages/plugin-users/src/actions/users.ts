import { actions } from '@nocobase/actions';
import { PASSWORD } from '@nocobase/database';
import cryptoRandomString from 'crypto-random-string';

export async function check(ctx: actions.Context, next: actions.Next) {
  ctx.body = ctx.state.currentUser;
  await next();
}

export async function login(ctx: actions.Context, next: actions.Next) {
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
    user.token = cryptoRandomString({ length: 20 });
    await user.save();
  }
  ctx.body = {
    data: user,
  };
  await next();
}

export async function logout(ctx: actions.Context, next: actions.Next) {
  ctx.body = {};
  await next();
}

export async function register(ctx: actions.Context, next: actions.Next) {
  const User = ctx.db.getModel('users');
  const { values } = ctx.action.params;
  const user = await User.create(values);
  ctx.body = {
    data: user,
  };
  await next();
}

export async function lostpassword(ctx: actions.Context, next: actions.Next) {
  const { values: { email } } = ctx.action.params;
  const User = ctx.db.getModel('users');
  const user = await User.findOne({
    where: {
      email,
    },
  });
  if (!user) {
    ctx.throw(401, 'Unauthorized');
  }
  user.reset_token = cryptoRandomString({ length: 20 });
  await user.save();
  ctx.body = user;
  await next();
}

export async function resetpassword(ctx: actions.Context, next: actions.Next) {
  const { values: { email, password, reset_token } } = ctx.action.params;
  const User = ctx.db.getModel('users');
  const user = await User.findOne({
    where: {
      email,
      reset_token,
    },
  });
  if (!user) {
    ctx.throw(401, 'Unauthorized');
  }
  user.token = null;
  user.reset_token = null;
  user.password = password;
  await user.save();
  ctx.body = user;
  await next();
}

export async function getUserByResetToken(ctx: actions.Context, next: actions.Next) {
  const { token } = ctx.action.params;
  const User = ctx.db.getModel('users');
  const user = await User.findOne({
    where: {
      reset_token: token,
    },
  });
  if (!user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = user;
  await next();
}
