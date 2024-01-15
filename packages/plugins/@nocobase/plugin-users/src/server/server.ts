import { Collection, Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { parse } from '@nocobase/utils';
import { resolve } from 'path';

import { namespace } from './';
import * as actions from './actions/users';
import { enUS, zhCN } from './locale';

export interface UserPluginConfig {
  name?: string;
}

export default class UsersPlugin extends Plugin<UserPluginConfig> {
  constructor(app, options) {
    super(app, options);
  }

  async beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);
    const cmd = this.app.findCommand('install');
    if (cmd) {
      cmd.requiredOption('-u, --root-username <rootUsername>', '', process.env.INIT_ROOT_USERNAME);
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
      $isNotCurrentUser(_, ctx) {
        return {
          [Op.ne]: ctx?.app?.ctx?.state?.currentUser?.id || -1,
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
      const { createdBy, updatedBy } = collection.options;
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

    this.app.acl.addFixedParams('users', 'destroy', () => {
      return {
        filter: {
          'id.$ne': 1,
        },
      };
    });

    this.app.acl.addFixedParams('collections', 'destroy', () => {
      return {
        filter: {
          'name.$ne': 'users',
        },
      };
    });

    const loggedInActions = ['updateProfile'];

    loggedInActions.forEach((action) => this.app.acl.allow('users', action, 'loggedIn'));
  }

  async load() {
    await this.importCollections(resolve(__dirname, 'collections'));

    this.db.addMigrations({
      namespace: 'users',
      directory: resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });
  }

  getInstallingData(options: any = {}) {
    const { INIT_ROOT_NICKNAME, INIT_ROOT_PASSWORD, INIT_ROOT_EMAIL, INIT_ROOT_USERNAME } = process.env;
    const {
      rootEmail = INIT_ROOT_EMAIL,
      rootPassword = INIT_ROOT_PASSWORD,
      rootNickname = INIT_ROOT_NICKNAME || 'Super Admin',
      rootUsername = INIT_ROOT_USERNAME || 'nocobase',
    } = options.users || options?.cliArgs?.[0] || {};
    return {
      rootEmail,
      rootPassword,
      rootNickname,
      rootUsername,
    };
  }

  async install(options) {
    const { rootNickname, rootPassword, rootEmail, rootUsername } = this.getInstallingData(options);
    const User = this.db.getCollection('users');
    if (await User.repository.findOne({ filter: { email: rootEmail } })) {
      return;
    }

    await User.repository.create({
      values: {
        email: rootEmail,
        password: rootPassword,
        nickname: rootNickname,
        username: rootUsername,
      },
    });

    const repo = this.db.getRepository<any>('collections');
    if (repo) {
      await repo.db2cm('users');
    }
  }
}
