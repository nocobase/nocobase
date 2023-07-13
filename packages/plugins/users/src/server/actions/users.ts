import { Context, Next } from '@nocobase/actions';
import { PasswordField } from '@nocobase/database';
import { branch } from '@nocobase/resourcer';
import crypto from 'crypto';
import { namespace } from '../';

export async function check(ctx: Context, next: Next) {
  if (ctx.state.currentUser) {
    const user = ctx.state.currentUser.toJSON();
    ctx.body = user;
  } else {
    ctx.body = {};
  }
  await next();
}

export async function signin(ctx: Context, next: Next) {
  const { authenticators, jwtService } = ctx.app.getPlugin('users');
  const branches = {};
  for (const [name, authenticator] of authenticators.getEntities()) {
    branches[name] = authenticator;
  }

  return branch(branches, (context) => context.action.params.authenticator ?? 'password')(ctx, () => {
    const user = ctx.state.currentUser.toJSON();
    const token = jwtService.sign({ userId: user.id });
    ctx.body = {
      user,
      token,
    };

    return next();
  });
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
    ctx.throw(400, { code: 'InvalidUserData', message: ctx.t('Please fill in your email address', { ns: namespace }) });
  }
  const User = ctx.db.getCollection('users');
  const user = await User.model.findOne<any>({
    where: {
      email,
    },
  });
  if (!user) {
    ctx.throw(404, {
      code: 'InvalidUserData',
      message: ctx.t('The email is incorrect, please re-enter', { ns: namespace }),
    });
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
    ctx.throw(404);
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
    ctx.throw(401);
  }
  ctx.body = user;
  await next();
}

export async function updateProfile(ctx: Context, next: Next) {
  const { values } = ctx.action.params;
  const { currentUser } = ctx.state;
  if (!currentUser) {
    ctx.throw(401);
  }
  const UserRepo = ctx.db.getRepository('users');
  const result = await UserRepo.update({
    filterByTk: currentUser.id,
    values,
  });
  ctx.body = result;
  await next();
}

export async function changePassword(ctx: Context, next: Next) {
  const {
    values: { oldPassword, newPassword },
  } = ctx.action.params;
  if (!ctx.state.currentUser) {
    ctx.throw(401);
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
    ctx.throw(401, ctx.t('The password is incorrect, please re-enter', { ns: namespace }));
  }
  user.password = newPassword;
  user.save();
  ctx.body = ctx.state.currentUser.toJSON();
  await next();
}
