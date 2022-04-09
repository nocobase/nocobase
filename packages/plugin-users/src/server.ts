import { Collection } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import * as actions from './actions/users';
import * as middlewares from './middlewares';
import { JwtOptions, JwtService } from './jwt-service';

export interface UserPluginConfig {
  jwt: JwtOptions;

  installing: {
    adminNickname: string;
    adminEmail: string;
    adminPassword: string;
  };
}

export default class UsersPlugin extends Plugin<UserPluginConfig> {
  public jwtService: JwtService;

  constructor(app, options) {
    super(app, options);
    this.jwtService = new JwtService(options?.jwt);
  }

  async beforeLoad() {
    this.db.on('users.afterCreateWithAssociations', async (model, options) => {
      const { transaction } = options;

      if (this.app.db.getCollection('roles')) {
        const defaultRole = await this.app.db.getRepository('roles').findOne({
          filter: {
            default: true,
          },
          transaction,
        });

        if (defaultRole && (await model.countRoles({ transaction })) == 0) {
          await model.addRoles(defaultRole, { transaction });
        }
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

    this.app.resourcer.use(middlewares.parseToken());

    const publicActions = ['check', 'signin', 'signup', 'lostpassword', 'resetpassword', 'getUserByResetToken'];
    const loggedInActions = ['signout', 'updateProfile', 'changePassword', 'setDefaultRole'];

    publicActions.forEach((action) => this.app.acl.skip('users', action));
    loggedInActions.forEach((action) => this.app.acl.skip('users', action, 'logged-in'));

    this.app.acl.skip('*', '*', (ctx) => {
      return ctx.state.currentUser?.id == 1;
    });
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  getRootUserInfo() {
    const {
      adminNickname = 'Super Admin',
      adminEmail = 'admin@nocobase.com',
      adminPassword = 'admin123',
    } = this.options.installing;

    return {
      adminNickname,
      adminEmail,
      adminPassword,
    };
  }

  async install() {
    const { adminNickname, adminPassword, adminEmail } = this.getRootUserInfo();

    const User = this.db.getCollection('users');
    await User.repository.create({
      values: {
        nickname: adminNickname,
        email: adminEmail,
        password: adminPassword,
        roles: ['admin'],
      },
    });

    const repo = this.db.getRepository<any>('collections');
    if (repo) {
      await repo.db2cm('users');
    }
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}
