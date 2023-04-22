import { Context, Next } from '@nocobase/actions';
import { Application, Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';

interface RegisterOptions {
  plugin: Plugin;
  authType: string;
  authMiddleware: (ctx: Context, next: Next) => Promise<any>;
  description?: string;
}

export interface RawUserInfo {
  // The unique id of the user.
  uuid: string;
  nickname: string;
  email?: string;
  avatar?: string;
  // Roles name from the authentication method.
  roles?: string | string[];
  // Metadata, some other information of the authentication method.
  meta?: {
    [key: string]: any;
  };
}

export class Authentication {
  app: Application;
  authenticators: Registry<{
    plugin: Plugin;
    authType: string;
    authMiddleware: (ctx: Context, next: Next) => Promise<any>;
  }> = new Registry();

  constructor(app: Application) {
    this.app = app;
  }

  error(func, message) {
    this.app.logger.error({
      package: 'authentication',
      func,
      message,
    });
  }

  /**
   * register
   * Used to register a authenticator in the installation process of a plugin.
   *
   * @param {RegisterOptions} options
   * @param {Plugin} options.plugin - The plugin that registers the authenticator.
   * @param {string} options.authType - The type of the authenticator. It is required to be unique in a plugin.
   * @param {Function} options.authMiddleware - The authentication middleware function.
   */
  async register(options: RegisterOptions) {
    const { plugin, authType, authMiddleware, description } = options;
    const pluginName = plugin.name;

    try {
      const pluginsRepo = this.app.db.getRepository('applicationPlugins');
      const pluginModel = await pluginsRepo.findOne({
        filter: {
          name: pluginName,
        },
      });
      if (!pluginModel) {
        this.error('register', `plugin ${pluginName} not exists.`);
        return null;
      }

      const repo = this.app.db.getRepository('authenticators');
      if (!repo) {
        this.error(
          'register',
          `authenticators collection not found, \
          please check if @nocobase/plugin-users is installed.`,
        );
        return null;
      }

      // Check if the authenticator already exists
      // pluginId + type is unique
      const exist = await repo.findOne({
        filter: {
          pluginId: pluginModel.id,
          type: authType,
          description: description || '',
        },
      });
      if (exist) {
        this.error('register', `authenticator ${authType} already exists in plugin ${pluginName}.`);
        return null;
      }

      const authenticator = await repo.create({
        values: {
          pluginId: pluginModel.id,
          type: authType,
        },
      });

      this.authenticators.register(authenticator.id, {
        plugin,
        authMiddleware,
        authType,
      });
      return authenticator;
    } catch (error) {
      this.error('register', `unexpected error: ${error.message}`);
      return null;
    }
  }

  async mapRoles(roles: string | string[]) {}

  /**
   * use
   * Use the authenticator by id.
   *
   * @param {string} authenticatorId - The id of the authenticator.
   */
  use(authenticatorId) {
    const authencator = this.authenticators.get(authenticatorId);
    return async (ctx: Context, next: Next) => {
      if (!authencator) {
        ctx.throw(404, ctx.t('Please use correct authencation method'));
      }
      const { authMiddleware, plugin, authType } = authencator;
      return authMiddleware(ctx, async () => {
        // If the user information is needed to be processed after authentication,
        // it is requied to be put into ctx.state.rawUser.
        if (!ctx.state.rawUser) {
          return next();
        }
        const raw: RawUserInfo = ctx.state.rawUser;
        const { uuid, nickname, email, avatar, roles, meta } = raw;
        const userAuthRepo = ctx.db.getRepository('userAuthInfomation');
        // Check if the user has already existed.
        const userAuth = await userAuthRepo.findOne({
          filter: { uuid, type: authType, plugin: plugin.name },
        });
        const user = await userAuth?.getUser();
        if (user) {
          ctx.state.currentUser = user;
          return next();
        }
        // Create user authenication information and new user.
        await userAuthRepo.create({
          values: {
            uuid,
            nickname,
            email,
            avatar,
            meta,
            type: authType,
            plugin: plugin.name,
            user: {
              nickname,
            },
          },
        });

        await this.mapRoles(roles);
        return next();
      });
    };
  }
}
