import { Collection, Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import parse from 'json-templates';
import { resolve } from 'path';
import { namespace } from './';
import * as actions from './actions/users';
import { JwtOptions, JwtService } from './jwt-service';
import { enUS, zhCN } from './locale';
import * as middlewares from './middlewares';
import { UserModel } from './models/UserModel';

export interface UserPluginConfig {
  jwt: JwtOptions;
}

export default class UsersPlugin extends Plugin<UserPluginConfig> {
  public jwtService: JwtService;

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
      cmd.option('-n, --root-nickname [rootNickname]');
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
    this.db.registerModels({ UserModel });
    this.db.on('users.afterCreateWithAssociations', async (model, options) => {
      const { transaction } = options;
      const repository = this.app.db.getRepository('roles');
      if (!repository) {
        return;
      }
      const defaultRole = await repository.findOne({
        filter: {
          default: true,
        },
        transaction,
      });
      if (defaultRole && (await model.countRoles({ transaction })) == 0) {
        await model.addRoles(defaultRole, { transaction });
      }
    });

    this.db.on('afterDefineCollection', (collection: Collection) => {
      let { createdBy, updatedBy } = collection.options;
      if (createdBy === true) {
        collection.setField('createdById', {
          type: 'context',
          dataType: 'integer',
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
          dataType: 'integer',
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

    this.app.resourcer.use(middlewares.parseToken({ plugin: this }));

    const publicActions = ['check', 'signin', 'signup', 'lostpassword', 'resetpassword', 'getUserByResetToken'];
    const loggedInActions = ['signout', 'updateProfile', 'changePassword', 'setDefaultRole'];

    publicActions.forEach((action) => this.app.acl.allow('users', action));
    loggedInActions.forEach((action) => this.app.acl.allow('users', action, 'loggedIn'));
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
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
    const user = await User.repository.create<UserModel>({
      values: {
        email: rootEmail,
        password: rootPassword,
        nickname: rootNickname,
        roles: ['root', 'admin', 'member'],
      },
    });

    await user.setDefaultRole('root');

    const repo = this.db.getRepository<any>('collections');
    if (repo) {
      await repo.db2cm('users');
    }
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}
