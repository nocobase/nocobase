import { Collection, Op } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import parse from 'json-templates';
import { resolve } from 'path';
import { namespace } from '.';
import { enUS, zhCN } from './locale';

import { afterUsersCreateOrUpdate } from './hooks';

export interface UserGroupPluginConfig {
}

export default class UserGroupsPlugin extends Plugin<UserGroupPluginConfig> {

  public tokenMiddleware;

  constructor(app, options) {
    super(app, options);
  }

  async beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);
    const cmd = this.app.findCommand('install');

    this.db.registerOperators({
    });


    //@todo 加个用户钩子，用户创建时如果没有机构，赋予默认机构。
    this.db.on('afterCreate', afterUsersCreateOrUpdate(this.app));
    //wheather add user update hook need to determine.
    //this.db.on('afterUpdate', afterUsersCreateOrUpdate(this.app));

  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  getInstallingData(options: any = {}) {
    const { INIT_USERGROUP_NAME} = process.env;
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
