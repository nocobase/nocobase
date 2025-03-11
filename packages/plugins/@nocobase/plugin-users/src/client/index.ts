/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { tval } from '@nocobase/utils/client';
import ACLPlugin from '@nocobase/plugin-acl/client';
import { lazy } from '@nocobase/client';
import { ChangePassword } from './ChangePassword';
import { EditProfile } from './EditProfile';
import { NickName } from './NickName';
import { SignOut } from './SignOut';

const { UsersProvider } = lazy(() => import('./UsersProvider'), 'UsersProvider');
const { UsersManagement } = lazy(() => import('./UsersManagement'), 'UsersManagement');
const { RoleUsersManager } = lazy(() => import('./RoleUsersManager'), 'RoleUsersManager');
class PluginUsersClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('users-permissions', {
      title: tval('Users & Permissions', { ns: 'users' }),
      icon: 'TeamOutlined',
    });
    this.app.pluginSettingsManager.add('users-permissions.users', {
      title: tval('Users'),
      icon: 'UserOutlined',
      Component: UsersManagement,
      aclSnippet: 'pm.users',
    });

    const acl = this.app.pm.get(ACLPlugin);
    acl.rolesManager.add('users', {
      title: tval('Users'),
      Component: RoleUsersManager,
    });
    // 个人中心注册 注册设置项
    this.app.addUserCenterSettingsItem({
      name: 'nickName',
      Component: NickName,
      sort: 0,
    });
    this.app.addUserCenterSettingsItem({
      name: 'divider1',
      type: 'divider',
      sort: 10,
    });
    this.app.addUserCenterSettingsItem({
      name: 'editProfile',
      Component: EditProfile,
      sort: 50,
    });
    this.app.addUserCenterSettingsItem({
      name: 'changePassword',
      Component: ChangePassword,
      sort: 100,
    });
    this.app.addUserCenterSettingsItem({
      name: 'divider_signOut',
      type: 'divider',
      sort: 900,
    });
    this.app.addUserCenterSettingsItem({
      name: 'signOut',
      Component: SignOut,
      sort: 1000,
    });
  }
}

export default PluginUsersClient;
