import parse from 'json-templates';
import { resolve } from 'path';

import { Collection, Op } from '@nocobase/database';
import { HandlerType } from '@nocobase/resourcer';
import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';

import { namespace } from './';
import * as actions from './actions/users';
import initAuthenticators from './authenticators';
import { JwtOptions, JwtService } from './jwt-service';
import { enUS, zhCN } from './locale';
import { parseToken } from './middlewares';

export interface UserPluginConfig {
  name?: string;
  jwt: JwtOptions;
}

export default class UsersPlugin extends Plugin<UserPluginConfig> {
  public jwtService: JwtService;

  public authenticators: Registry<HandlerType> = new Registry();

  constructor(app, options) {
    super(app, options);
    this.jwtService = new JwtService(options?.jwt || {});
  }

  async beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);
    const cmd = this.app.findCommand('install');
    if (cmd) {
      cmd.requiredOption('-e, --root-email <rootEmail>', '', process.env.INIT_ROOT_EMAIL);
      cmd.requiredOption('-p, --root-password <rootPassword>', '', process.env.INIT_ROOT_PASSWORD);
      cmd.option('-n, --root-nickname <rootNickname>');
    }
    this.db.registerOperators({
      $isCurrentUser(_, ctx) {
        return {
          [Op.eq]: ctx?.app?.ctx?.state?.currentUser?.id || -1,
        };
      },
      $isVar(val, ctx) {
        const obj = parse({ val: `{{${val}}}` })(JSON.parse(JSON.stringify(ctx?.app?.ctx?.state)));
        return {
          [Op.eq]: obj.val,
        };
      },
    });

    this.db.on('afterDefineCollection', (collection: Collection) => {
      let { createdBy, updatedBy } = collection.options;
      if (createdBy === true) {
        collection.setField('createdById', {
          type: 'context',
          dataType: 'bigInt',
          dataIndex: 'state.currentUser.id',
          createOnly: true,
          visible: true,
          index: true,
        });
        collection.setField('createdBy', {
          type: 'belongsTo',
          target: 'users',
          foreignKey: 'createdById',
          targetKey: 'id',
        });
      }
      if (updatedBy === true) {
        collection.setField('updatedById', {
          type: 'context',
          dataType: 'bigInt',
          dataIndex: 'state.currentUser.id',
          visible: true,
          index: true,
        });
        collection.setField('updatedBy', {
          type: 'belongsTo',
          target: 'users',
          foreignKey: 'updatedById',
          targetKey: 'id',
        });
      }
    });

    for (const [key, action] of Object.entries(actions)) {
      this.app.resourcer.registerActionHandler(`users:${key}`, action);
    }

    this.app.resourcer.use(parseToken, { tag: 'parseToken' });

    const publicActions = ['check', 'signin', 'signup', 'lostpassword', 'resetpassword', 'getUserByResetToken'];
    const loggedInActions = ['signout', 'updateProfile', 'changePassword'];

    publicActions.forEach((action) => this.app.acl.allow('users', action));
    loggedInActions.forEach((action) => this.app.acl.allow('users', action, 'loggedIn'));
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.db.addMigrations({
      namespace: 'users',
      directory: resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });

    initAuthenticators(this);

    // TODO(module): should move to preset
    const verificationPlugin = this.app.getPlugin('verification') as any;
    if (verificationPlugin && process.env.DEFAULT_SMS_VERIFY_CODE_PROVIDER) {
      verificationPlugin.interceptors.register('users:signin', {
        manual: true,
        provider: process.env.DEFAULT_SMS_VERIFY_CODE_PROVIDER,
        getReceiver(ctx) {
          return ctx.action.params.values.phone;
        },
        expiresIn: 120,
        validate: async (ctx, phone) => {
          if (!phone) {
            throw new Error(ctx.t('Not a valid cellphone number, please re-enter'));
          }
          const User = this.db.getCollection('users');
          const exists = await User.model.count({
            where: {
              phone,
            },
          });
          if (!exists) {
            throw new Error(ctx.t('The phone number is not registered, please register first', { ns: namespace }));
          }

          return true;
        },
      });

      verificationPlugin.interceptors.register('users:signup', {
        provider: process.env.DEFAULT_SMS_VERIFY_CODE_PROVIDER,
        getReceiver(ctx) {
          return ctx.action.params.values.phone;
        },
        expiresIn: 120,
        validate: async (ctx, phone) => {
          if (!phone) {
            throw new Error(ctx.t('Not a valid cellphone number, please re-enter', { ns: namespace }));
          }
          const User = this.db.getCollection('users');
          const exists = await User.model.count({
            where: {
              phone,
            },
          });
          if (exists) {
            throw new Error(ctx.t('The phone number has been registered, please login directly', { ns: namespace }));
          }

          return true;
        },
      });

      this.authenticators.register('sms', (ctx, next) =>
        verificationPlugin.intercept(ctx, async () => {
          const { values } = ctx.action.params;

          const User = ctx.db.getCollection('users');
          const user = await User.model.findOne({
            where: {
              phone: values.phone,
            },
          });
          if (!user) {
            return ctx.throw(404, ctx.t('The phone number is incorrect, please re-enter', { ns: namespace }));
          }

          ctx.state.currentUser = user;

          return next();
        }),
      );
    }
  }

  getInstallingData(options: any = {}) {
    const { INIT_ROOT_NICKNAME, INIT_ROOT_PASSWORD, INIT_ROOT_EMAIL } = process.env;
    const {
      rootEmail = INIT_ROOT_EMAIL,
      rootPassword = INIT_ROOT_PASSWORD,
      rootNickname = INIT_ROOT_NICKNAME || 'Super Admin',
    } = options.users || options?.cliArgs?.[0] || {};
    return {
      rootEmail,
      rootPassword,
      rootNickname,
    };
  }

  async install(options) {
    const { rootNickname, rootPassword, rootEmail } = this.getInstallingData(options);
    const User = this.db.getCollection('users');
    const user = await User.repository.create({
      values: {
        email: rootEmail,
        password: rootPassword,
        nickname: rootNickname,
      },
    });

    const repo = this.db.getRepository<any>('collections');
    if (repo) {
      await repo.db2cm('users');
    }
  }
}
