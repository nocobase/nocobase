import { Context, Next } from '@nocobase/actions';
import { PasswordField } from '@nocobase/database';
import crypto from 'crypto';

export async function check(ctx: Context, next: Next) {
  if (ctx.state.currentUser) {
    const user = ctx.state.currentUser.toJSON();
    ctx.body = user;
    await next();
  } else {
    ctx.throw(401, 'Unauthorized');
  }
}

export async function signin(ctx: Context, next: Next) {
  const { uniqueField = 'email', values } = ctx.action.params;

  if (!values[uniqueField]) {
    ctx.throw(401, '请填写邮箱账号');
  }
  const User = ctx.db.getCollection('users');
  const user = await User.model.findOne<any>({
    where: {
      [uniqueField]: values[uniqueField],
    },
  });
  if (!user) {
    ctx.throw(401, '邮箱账号未注册');
  }
  const pwd = User.getField<PasswordField>('password');
  const isValid = await pwd.verify(values.password, user.password);
  if (!isValid) {
    ctx.throw(401, '密码错误，请您重新输入');
  }

  const pluginUser = ctx.app.getPlugin('@nocobase/plugin-users');

  ctx.body = {
    ...user.toJSON(),
    token: pluginUser.jwtService.sign({
      userId: user.get('id'),
    }),
  };
  await next();
}

export async function signout(ctx: Context, next: Next) {
  ctx.body = ctx.state.currentUser;
  await next();
}

export async function signup(ctx: Context, next: Next) {
  const User = ctx.db.getRepository('users');
  const { values } = ctx.action.params;
  const user = await User.create({ values });
  ctx.body = user;
  await next();
}

export async function lostpassword(ctx: Context, next: Next) {
  const {
    values: { email },
  } = ctx.action.params;
  if (!email) {
    ctx.throw(401, '请填写邮箱账号');
  }
  const User = ctx.db.getCollection('users');
  const user = await User.model.findOne<any>({
    where: {
      email,
    },
  });
  if (!user) {
    ctx.throw(401, '邮箱账号未注册');
  }
  user.resetToken = crypto.randomBytes(20).toString('hex');
  await user.save();
  ctx.body = user;
  await next();
}

export async function resetpassword(ctx: Context, next: Next) {
  const {
    values: { email, password, resetToken },
  } = ctx.action.params;
  const User = ctx.db.getCollection('users');
  const user = await User.model.findOne<any>({
    where: {
      email,
      resetToken,
    },
  });
  if (!user) {
    ctx.throw(401, 'Unauthorized');
  }
  user.token = null;
  user.resetToken = null;
  user.password = password;
  await user.save();
  ctx.body = user;
  await next();
}

export async function getUserByResetToken(ctx: Context, next: Next) {
  const { token } = ctx.action.params;
  const User = ctx.db.getCollection('users');
  const user = await User.model.findOne({
    where: {
      resetToken: token,
    },
  });
  if (!user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = user;
  await next();
}

export async function updateProfile(ctx: Context, next: Next) {
  const { values } = ctx.action.params;
  if (!ctx.state.currentUser) {
    ctx.throw(401, 'Unauthorized');
  }
  await ctx.state.currentUser.update(values);
  ctx.body = ctx.state.currentUser;
  await next();
}

export async function changePassword(ctx: Context, next: Next) {
  const {
    values: { oldPassword, newPassword },
  } = ctx.action.params;
  if (!ctx.state.currentUser) {
    ctx.throw(401, 'Unauthorized');
  }
  const User = ctx.db.getCollection('users');
  const user = await User.model.findOne<any>({
    where: {
      email: ctx.state.currentUser.email,
    },
  });
  const pwd = User.getField<PasswordField>('password');
  const isValid = await pwd.verify(oldPassword, user.password);
  if (!isValid) {
    ctx.throw(401, '密码错误，请您重新输入');
  }
  user.password = newPassword;
  user.save();
  ctx.body = ctx.state.currentUser.toJSON();
  await next();
}

export async function setDefaultRole(ctx: Context, next: Next) {
  const {
    values: { roleName },
  } = ctx.action.params;

  await ctx.state.currentUser.setDefaultRole(roleName);

  ctx.body = 'ok';

  await next();
}
