import { Application, Plugin } from '@nocobase/server';

interface RegisterOptions {
  plugin: Plugin;
  authType: string;
  authMiddleware: Function;
  description?: string;
}

export class Authentication {
  app: Application;
  authenticators: Map<string, Function> = new Map();

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

      this.authenticators.set(authenticator.id, authMiddleware);
      return authenticator;
    } catch (error) {
      this.error('register', `unexpected error: ${error.message}`);
      return null;
    }
  }

  async use(authenticatorId) {
    const auth = this.authenticators.get(authenticatorId);
  }
}
