/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Cache } from '@nocobase/cache';
import { InstallOptions, Plugin } from '@nocobase/server';
import { aggregateSearch, removeOwner, setOwner } from './actions/departments';
import { listExcludeDept, setMainDepartment } from './actions/users';
import { departmentsField, mainDepartmentField } from './collections/users';
import {
  destroyDepartmentCheck,
  resetUserDepartmentsCache,
  setDepartmentOwners,
  setMainDepartment as setMainDepartmentMiddleware,
  updateDepartmentIsLeaf,
  setDepartmentsInfo,
} from './middlewares';
import { DepartmentModel } from './models/department';
import { DepartmentDataSyncResource } from './department-data-sync-resource';
import PluginUserDataSyncServer from '@nocobase/plugin-user-data-sync';
import { DataSource } from '@nocobase/data-source-manager';

export class PluginDepartmentsServer extends Plugin {
  afterAdd() {}

  beforeLoad() {
    this.app.db.registerModels({ DepartmentModel });

    this.app.acl.addFixedParams('collections', 'destroy', () => {
      return {
        filter: {
          'name.$notIn': ['departments', 'departmentsUsers', 'departmentsRoles'],
        },
      };
    });
  }

  async load() {
    this.app.resourceManager.registerActionHandlers({
      'users:listExcludeDept': listExcludeDept,
      'users:setMainDepartment': setMainDepartment,
      'departments:aggregateSearch': aggregateSearch,
      'departments:setOwner': setOwner,
      'departments:removeOwner': removeOwner,
    });

    this.app.acl.allow('users', ['setMainDepartment', 'listExcludeDept'], 'loggedIn');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: [
        'departments:*',
        'roles:list',
        'users:list',
        'users:listExcludeDept',
        'users:setMainDepartment',
        'users.departments:*',
        'roles.departments:*',
        'departments.members:*',
      ],
    });

    this.app.resourceManager.use(setDepartmentsInfo, {
      tag: 'setDepartmentsInfo',
      before: 'setCurrentRole',
      after: 'auth',
    });
    this.app.dataSourceManager.afterAddDataSource((dataSource: DataSource) => {
      dataSource.resourceManager.use(setDepartmentsInfo, {
        tag: 'setDepartmentsInfo',
        before: 'setCurrentRole',
        after: 'auth',
      });
    });

    this.app.resourceManager.use(setDepartmentOwners);
    this.app.resourceManager.use(destroyDepartmentCheck);
    this.app.resourceManager.use(updateDepartmentIsLeaf);
    this.app.resourceManager.use(resetUserDepartmentsCache);
    this.app.resourceManager.use(setMainDepartmentMiddleware);

    // Delete cache when the departments of a user changed
    this.app.db.on('departmentsUsers.afterSave', async (model) => {
      const cache = this.app.cache as Cache;
      await cache.del(`departments:${model.get('userId')}`);
    });
    this.app.db.on('departmentsUsers.afterDestroy', async (model) => {
      const cache = this.app.cache as Cache;
      await cache.del(`departments:${model.get('userId')}`);
    });

    // Validate mainDepartmentId before saving user
    this.app.db.on('users.beforeSave', async (model, { transaction }) => {
      const mainDepartmentId = model.get('mainDepartmentId');
      if (mainDepartmentId) {
        const userId = model.get('id');
        if (userId) {
          const userDepartment = await this.app.db.getRepository('departmentsUsers').findOne({
            filter: {
              userId: userId,
              departmentId: mainDepartmentId,
            },
            transaction,
          });

          if (!userDepartment) {
            throw new Error(`Invalid mainDepartment, it must be one of the user's departments`);
          }
        }
      }
    });

    this.app.on('beforeSignOut', ({ userId }) => {
      this.app.cache.del(`departments:${userId}`);
    });

    const userDataSyncPlugin = this.app.pm.get('user-data-sync') as PluginUserDataSyncServer;
    if (userDataSyncPlugin && userDataSyncPlugin.enabled) {
      userDataSyncPlugin.resourceManager.registerResource(new DepartmentDataSyncResource(this.db, this.app.logger), {
        // write department records after writing user records
        after: 'users',
      });
    }
  }

  async install(options?: InstallOptions) {
    const collectionRepo = this.db.getRepository<any>('collections');
    if (collectionRepo) {
      await collectionRepo.db2cm('departments');
    }
    const fieldRepo = this.db.getRepository('fields');
    if (fieldRepo) {
      const isDepartmentsFieldExists = await fieldRepo.count({
        filter: {
          name: 'departments',
          collectionName: 'users',
        },
      });
      if (!isDepartmentsFieldExists) {
        await fieldRepo.create({
          values: departmentsField,
        });
      }
      const isMainDepartmentFieldExists = await fieldRepo.count({
        filter: {
          name: 'mainDepartment',
          collectionName: 'users',
        },
      });
      if (!isMainDepartmentFieldExists) {
        await fieldRepo.create({
          values: mainDepartmentField,
        });
      }
    }
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginDepartmentsServer;
