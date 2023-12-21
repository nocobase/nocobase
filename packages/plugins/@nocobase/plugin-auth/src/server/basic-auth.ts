import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { PasswordField } from '@nocobase/database';
import crypto from 'crypto';
import { namespace } from '../preset';

export class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  async validate() {
    const ctx = this.ctx;
    const {
      values: {
        account, // Username or email
        email, // Old parameter, compatible with old api
        password,
      },
    } = ctx.action.params;

    if (!account && !email) {
      ctx.throw(400, ctx.t('Please enter your username or email', { ns: namespace }));
    }
    const filter = email
      ? { email }
      : {
          $or: [{ username: account }, { email: account }],
        };
    const user = await this.userRepository.findOne({
      filter,
    });

    if (!user) {
      ctx.throw(401, ctx.t('The username or email is incorrect, please re-enter', { ns: namespace }));
    }

    const field = this.userCollection.getField<PasswordField>('password');
    const valid = await field.verify(password, user.password);
    if (!valid) {
      ctx.throw(401, ctx.t('The password is incorrect, please re-enter', { ns: namespace }));
    }
    return user;
  }

  async signUp() {
    const ctx = this.ctx;
    const options = this.authenticator.options?.public || {};
    if (!options.allowSignUp) {
      ctx.throw(403, ctx.t('Not allowed to sign up', { ns: namespace }));
    }
    const User = ctx.db.getRepository('users');
    const { values } = ctx.action.params;
    const { username, password, confirm_password } = values;
    if (!/^[^@.<>"'/]{2,16}$/.test(username)) {
      ctx.throw(400, ctx.t('Please enter a valid username', { ns: namespace }));
    }
    if (password !== confirm_password) {
      ctx.throw(400, ctx.t('The password is inconsistent, please re-enter', { ns: namespace }));
    }
    const user = await User.create({ values: { username, password } });
    return user;
  }

  async lostPassword() {
    const ctx = this.ctx;
    const {
      values: { email },
    } = ctx.action.params;
    if (!email) {
      ctx.throw(400, ctx.t('Please fill in your email address', { ns: namespace }));
    }
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      ctx.throw(401, ctx.t('The email is incorrect, please re-enter', { ns: namespace }));
    }
    user.resetToken = crypto.randomBytes(20).toString('hex');
    await user.save();
    return user;
  }

  async resetPassword() {
    const ctx = this.ctx;
    const {
      values: { email, password, resetToken },
    } = ctx.action.params;
    const user = await this.userRepository.findOne({
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
    return user;
  }

  async getUserByResetToken() {
    const ctx = this.ctx;
    const { token } = ctx.action.params;
    const user = await this.userRepository.findOne({
      where: {
        resetToken: token,
      },
    });
    if (!user) {
      ctx.throw(401);
    }
    return user;
  }

  async changePassword() {
    const ctx = this.ctx;
    const {
      values: { oldPassword, newPassword },
    } = ctx.action.params;
    const currentUser = ctx.auth.user;
    if (!currentUser) {
      ctx.throw(401);
    }
    let key: string;
    if (currentUser.username) {
      key = 'username';
    } else {
      key = 'email';
    }
    const user = await this.userRepository.findOne({
      where: {
        [key]: currentUser[key],
      },
    });
    const pwd = this.userCollection.getField<PasswordField>('password');
    const isValid = await pwd.verify(oldPassword, user.password);
    if (!isValid) {
      ctx.throw(401, ctx.t('The password is incorrect, please re-enter', { ns: namespace }));
    }
    user.password = newPassword;
    await user.save();
    return currentUser;
  }
}
