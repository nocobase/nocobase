import { Collection, Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import parse from 'json-templates';
import { resolve } from 'path';
import { namespace } from '.';
import { enUS, zhCN } from './locale';

import * as userGroupsActions from './actions/usergroups';
import * as usersActions from './actions/users';

import { UserGroupsRepository } from './repository/userGroupRepository';
import { UserRepository } from './repository/userRepository';

import { afterUsersCreateOrUpdate, afterUserGroupsCreateWithAssociation, afterUserGroupsSaveWithAssociation } from './hooks';

export interface UserGroupPluginConfig {
}

export default class UserGroupsPlugin extends Plugin<UserGroupPluginConfig> {

  public tokenMiddleware;

  constructor(app, options) {
    super(app, options);
  }

  /**
   *regist repository.
   */
  registerRepository() {
    this.app.db.registerRepositories({
      UserGroupsRepository,
    });
    this.app.db.registerRepositories({
      UserRepository,
    });
  }

  async beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);
    const cmd = this.app.findCommand('install');

    this.registerRepository();

    //regist usergroup's actions.
    for (const [key, action] of Object.entries(userGroupsActions)) {
      this.app.resourcer.registerActionHandler(`userGroups:${key}`, action);
    }
    this.app.acl.allow('userGroups', '*', 'loggedIn');

    //regist the user's actions.
    for (const [key, action] of Object.entries(usersActions)) {
      this.app.resourcer.registerActionHandler(`users:${key}`, action);
    }
    this.app.acl.allow('users', '*', 'loggedIn');



    //@todo 加个用户钩子，用户创建时如果没有机构，赋予默认机构。
    this.db.on('users.afterCreate', afterUsersCreateOrUpdate(this.app));
    //@todo 加个用户组钩子，用户组创建时添加ptree，作为treepath
    this.db.on('userGroups.afterCreateWithAssociations', afterUserGroupsCreateWithAssociation(this.app));
    // this.db.on('userGroups.beforeUpdate', afterUserGroupsSaveWithAssociation(this.app));
    // this.db.on('userGroups.afterBulkCreate', afterUserGroupsSaveWithAssociation(this.app));
    //wheather add user update hook need to determine.
    //this.db.on('afterUpdate', afterUsersCreateOrUpdate(this.app));

  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  getInstallingData(options: any = {}) {
    const { INIT_USERGROUP_NAME } = process.env;
    const {
      defaultname = INIT_USERGROUP_NAME || 'default',
    } = options.users || options?.cliArgs?.[0] || {};
    return {
      defaultname,
    };
  }

  /**
   * add default one to the usergroups.
   * @param options 
   */
  async install(options) {
    const { defaultname } = this.getInstallingData(options);
    const UserGroup = this.db.getCollection('userGroups');
    const defaltUserGroup = await UserGroup.repository.create({
      values: {
        name: defaultname,
        status: 1
      },
    });

    const repo = this.db.getRepository<any>('collections');
    if (repo) {
      await repo.db2cm('userGroups');
    }
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}
