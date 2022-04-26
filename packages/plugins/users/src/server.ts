import { Collection, Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import * as actions from './actions/users';
import { JwtOptions, JwtService } from './jwt-service';
import * as middlewares from './middlewares';
import { UserModel } from './models/UserModel';

export interface UserPluginConfig {
  jwt: JwtOptions;

  installing?: {
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
    this.db.registerOperators({
      $isCurrentUser(_, ctx) {
        return {
          [Op.eq]: ctx?.app?.ctx?.state?.currentUser?.id || -1,
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
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
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
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
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

    this.app.resourcer.addParamsMerger('collections:destroy', () => {
      return {
        filter: {
          'name.$ne': 'users',
        },
      };
    });

    this.app.resourcer.addParamsMerger('users:destroy', () => {
      return {
        filter: {
          'id.$ne': 1,
        },
      };
    });

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

  getRootUserInfo() {
    const {
      adminNickname = 'Super Admin',
      adminEmail = 'admin@nocobase.com',
      adminPassword = 'admin123',
    } = this.options.installing || {};

    return {
      adminNickname,
      adminEmail,
      adminPassword,
    };
  }

  async install() {
    const { adminNickname, adminPassword, adminEmail } = this.getRootUserInfo();

    const User = this.db.getCollection('users');
    const user = await User.repository.create<UserModel>({
      values: {
        nickname: adminNickname,
        email: adminEmail,
        password: adminPassword,
        roles: ['root', 'admin'],
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
