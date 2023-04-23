import { Context, Next } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import { Application, Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';

interface RegisterOptions {
  plugin: Plugin;
  authType: string;
  authMiddleware: (ctx: Context, next: Next) => Promise<any>;
  description?: string;
}

type sourceRole =
  | string
  | {
      name: string;
      title?: string;
      // Default role of the current user, not the default role of system.
      default?: boolean;
      description?: string;
    };

export interface RawUserInfo {
  // The unique id of the user.
  uuid: string;
  nickname: string;
  email?: string;
  avatar?: string;
  // Roles name from the authentication method.
  roles?: sourceRole | sourceRole[];
  // Metadata, some other information of the authentication method.
  meta?: {
    [key: string]: any;
  };
}

interface RoleSetting {
  mapping: {
    source: string;
    target: string;
  }[];
  useDefaultRole: boolean;
  createIfNotExists: boolean;
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

  async setDefaultRole(user: Model) {
    const roleRepo = this.app.db.getRepository('roles');
    const defaultRole = await roleRepo.findOne({
      filter: {
        default: true,
      },
    });
    if (defaultRole) {
      await user.setRoles(defaultRole.name);
    }
  }

  /**
   * mapRoles
   * Map the roles from the authentication method to the roles in Nocobase.
   * TODO(yangqia): move some logic to model layer.
   *
   * @param {number} authenticatorId - The id of the authenticator.
   * @param {number} user - The model of the user.
   * @param {sourceRole | sourceRole[]} roles - Role names of the user from the authentication method.
   */
  async mapRoles(authenticatorId: number, user: Model, roles: sourceRole | sourceRole[]) {
    const repo = this.app.db.getRepository('authenticators');
    const roleRepo = this.app.db.getRepository('roles');
    const authenticator = await repo.findById(authenticatorId);
    const roleSetting: RoleSetting = authenticator.settings?.role || {};
    if (roleSetting.useDefaultRole) {
      // If role mapping rule is not set or 'useDefaultRole' is true, use the default role.
      await this.setDefaultRole(user);
      return;
    }

    let sourceRoles = roles;
    if (!Array.isArray(sourceRoles)) {
      sourceRoles = [sourceRoles];
    }
    const roleMapping: Map<string, string> = (roleSetting.mapping || []).reduce((result, item) => {
      result.set(item.source, item.target);
      return result;
    }, new Map<string, string>());
    const rolesToCreate: Omit<sourceRole, 'default'>[] = [];
    const userRoleNames = [];
    const roleModels = await roleRepo.find({ fields: ['name'] });
    let defaultRole;
    // Process role mapping rules.
    for (const role of sourceRoles) {
      let targetName: string;
      let sourceName: string;
      let title: string;
      let isDefault = false;
      let description = '';
      if (typeof role === 'object') {
        sourceName = role.name;
        title = role.title || role.name;
        isDefault = role.default;
        description = role.description || '';
      } else {
        sourceName = role;
      }
      const targetRole = roleMapping.get(sourceName);
      let targetRoleModel;
      if (targetRole) {
        // If the mapping rule is set, use the target role name.
        targetRoleModel = roleModels.find((item) => item.name === targetRole);
      } else {
        // If the mapping rule is not set, use the source role name.
        targetRoleModel = roleModels.find((item) => item.name === sourceName);
      }
      if (targetRoleModel) {
        targetName = targetRoleModel.name;
      } else if (roleSetting.createIfNotExists) {
        // If the target role not exists and 'createIfNotExists' is true,
        // put it into the 'rolesToCreate' array.
        targetName = sourceName;
        rolesToCreate.push({
          name: targetName,
          description,
          title: title || sourceName,
        });
      }
      if (targetName) {
        userRoleNames.push(targetName);
        if (isDefault) {
          defaultRole = targetName;
        }
      }
    }
    if (!userRoleNames.length) {
      // If no role is found, use the default role.
      await this.setDefaultRole(user);
      return;
    }
    // Create roles if needed and associate roles with the user.
    await this.app.db.sequelize.transaction(async (_) => {
      if (rolesToCreate.length) {
        await roleRepo.createMany({ records: rolesToCreate });
      }
      await user.setRoles(userRoleNames);

      defaultRole = defaultRole || userRoleNames[0];
      const rolesUsersRepo = this.app.db.getRepository('rolesUsers');
      await rolesUsersRepo.update({
        filter: {
          userId: user.id,
          roleName: defaultRole,
        },
        values: {
          default: true,
        },
      });
    });
  }

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
        ctx.throw(404, ctx.t('Please use correct authencation method.'));
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
        if (userAuth) {
          const user = await userAuth.getUser();
          if (user) {
            ctx.state.currentUser = user;
            return next();
          }
        }
        // Create user authenication information and new user.
        const newUserAuth = await userAuthRepo.create({
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
        const userRepo = await this.app.db.getRepository('users');
        const user = await userRepo.findById(newUserAuth.userId);

        try {
          await this.mapRoles(authenticatorId, user, roles);
        } catch (err) {
          this.error('use', `Failed to map roles: ${err.message}`);
          ctx.throw(500, ctx.t('Failed to map roles'));
        }

        ctx.state.currentUser = user;
        return next();
      });
    };
  }
}
