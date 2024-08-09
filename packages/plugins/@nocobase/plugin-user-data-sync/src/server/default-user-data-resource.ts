/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { UserDataResource } from './user-data-resource-manager';
import { Logger } from '@nocobase/logger';

export class DefaultUserDataResource implements UserDataResource {
  accepts: ('user' | 'department')[];
  db: Database;
  logger: Logger;

  constructor(db: Database, logger: Logger) {
    this.accepts = ['user', 'department'];
    this.db = db;
    this.logger = logger;
  }

  get userRepo() {
    return this.db.getRepository('users');
  }

  get deptRepo() {
    return this.db.getRepository('departments');
  }

  get syncRecordRepo() {
    return this.db.getRepository('userDataSyncRecords');
  }

  async updateOrCreate(originRecords: any[]): Promise<{ newRecords: any[] }> {
    this.logger.info(`updateOrCreate: there is ${originRecords.length} records need to update or create`);
    const result = { newRecords: [] };
    let index = 0;
    for (const data of originRecords) {
      index++;
      this.logger.info(`updateOrCreate: ${index}/${originRecords.length} record, data: ${JSON.stringify(data)}`);
      let pk: string;
      if (!this.accepts.includes(data.resource)) {
        continue;
      }
      if (data.resource === 'user') {
        pk = await this.updateOrCreateUser(data);
      } else if (data.resource === 'department' && this.deptRepo) {
        pk = await this.updateOrCreateDepartment(data);
      } else {
        pk = undefined;
        this.logger.warn(`updateOrCreate: unsupported data type: ${data.resource}`);
      }
      if (pk) {
        result.newRecords.push({
          sourceId: data.sourceId,
          resourcePk: pk,
        });
      }
      this.logger.info(`updateOrCreate: ${index}/${originRecords.length} record done`);
    }
    return result;
  }

  async updateOrCreateUser(originRecord: any): Promise<string> {
    const { sourceUniqueKey, metaData, resourcePk, sourceName } = originRecord;
    const sourceUser = JSON.parse(metaData);
    if (resourcePk) {
      // 已存在的用户，更新信息
      const user = await this.userRepo.findOne({
        filterByTk: resourcePk,
      });
      await this.updateUser(user, sourceUser, sourceName);
      return undefined;
    } else {
      // 根据 uniquekey 查找用户
      const filter = {};
      filter[sourceUniqueKey] = sourceUser[sourceUniqueKey];
      const user = await this.userRepo.findOne({
        filter,
      });
      if (user) {
        await this.updateUser(user, sourceUser, sourceName);
        return user.id;
      } else {
        return await this.createUser(sourceUniqueKey, sourceUser, sourceName);
      }
    }
  }

  async updateUser(user: any, sourceUser: any, sourceName: string) {
    if (sourceUser.isDeleted) {
      // 删除用户
      await user.destroy();
      return;
    }
    let dataChanged = false;
    if (sourceUser.phone !== undefined && user.phone !== sourceUser.phone) {
      user.phone = sourceUser.phone;
      dataChanged = true;
    }
    if (sourceUser.email !== undefined && user.email !== sourceUser.email) {
      user.email = sourceUser.email;
      dataChanged = true;
    }
    if (sourceUser.nickname !== undefined && user.nickname !== sourceUser.nickname) {
      user.name = sourceUser.name;
      dataChanged = true;
    }
    if (dataChanged) {
      await user.save();
    }
    // 更新用户所属部门
    await this.updateUserDepartments(user, sourceUser.departments, sourceName);
  }

  async createUser(sourceUniqueKey: string, sourceUser: any, sourceName): Promise<string> {
    const user = await this.userRepo.create({
      values: {
        nickname: sourceUser.nickname,
        phone: sourceUser.phone,
        email: sourceUser.email,
        username: sourceUniqueKey === 'id' ? sourceUser.id : undefined,
      },
    });
    // 更新用户所属部门
    await this.updateUserDepartments(user, sourceUser.departments, sourceName);
    return user.id;
  }

  async updateUserDepartments(user: any, sourceDepartmentIds: any[], sourceName: string) {
    if (!this.deptRepo) {
      return;
    }
    if (!sourceDepartmentIds || !sourceDepartmentIds.length) {
      const userDepartments = await user.getDepartments();
      if (userDepartments.length) {
        await user.removeDepartments(userDepartments);
      }
    } else {
      // 查询部门同步记录
      const syncDepartmentRecords = await this.syncRecordRepo.find({
        filter: { sourceName, resource: 'department', sourceId: { $in: sourceDepartmentIds } },
      });
      const departmentIds = syncDepartmentRecords.map((record) => record.resourcePk);
      const departments = await this.deptRepo.find({ filter: { id: { $in: departmentIds } } });
      const userDepartments = await user.getDepartments();
      // 需要删除的部门
      const toRemoveDepartments = userDepartments.filter((department) => {
        return !departments.find((sourceDepartment) => sourceDepartment.id === department.id);
      });
      if (toRemoveDepartments.length) {
        await user.removeDepartments(toRemoveDepartments);
      }
      // 需要添加的部门
      const toAddDepartments = departments.filter((department) => {
        if (userDepartments.length === 0) {
          return true;
        }
        return !userDepartments.find((userDepartment) => userDepartment.id === department.id);
      });
      if (toAddDepartments.length) {
        await user.addDepartments(toAddDepartments);
      }
    }
  }

  async updateOrCreateDepartment(originRecord: any): Promise<string> {
    const { metaData, resourcePk, sourceName } = originRecord;
    const sourceDepartment = JSON.parse(metaData);
    if (resourcePk) {
      // 已存在的部门，更新信息
      const department = await this.deptRepo.findOne({
        filterByTk: resourcePk,
      });
      await this.updateDepartment(department, sourceDepartment, sourceName);
      return undefined;
    } else {
      return this.createDepartment(sourceDepartment, sourceName);
    }
  }

  async updateDepartment(department: any, sourceDepartment: any, sourceName: string) {
    if (sourceDepartment.isDeleted) {
      // 删除部门
      await department.destroy();
      return;
    }
    let dataChanged = false;
    if (sourceDepartment.name !== undefined && department.name !== sourceDepartment.name) {
      department.name = sourceDepartment.name;
      dataChanged = true;
    }
    if (dataChanged) {
      await department.save();
    }
    this.updateParentDepartment(department, sourceDepartment.parentId, sourceName);
  }

  async createDepartment(sourceDepartment: any, sourceName: string): Promise<string> {
    const department = await this.deptRepo.create({
      values: {
        title: sourceDepartment.name,
      },
    });
    this.updateParentDepartment(department, sourceDepartment.parentId, sourceName);
    return department.id;
  }

  async updateParentDepartment(department: any, parentId: string, sourceName: string) {
    if (!parentId) {
      const parentDepartment = await department.getParent();
      if (parentDepartment) {
        await department.setParent(null);
      }
    } else {
      const syncDepartmentRecord = await this.syncRecordRepo.findOne({
        filter: { sourceName, resource: 'department', sourceId: parentId },
      });
      if (syncDepartmentRecord) {
        const parentDepartment = await this.deptRepo.findOne({
          filterByTk: syncDepartmentRecord.resourcePk,
        });
        if (!parentDepartment) {
          await department.setParent(null);
          return;
        }
        const parent = await department.getParent();
        if (parent) {
          if (parentDepartment.id !== parent.id) {
            await department.setParent(parentDepartment);
          }
        } else {
          await department.setParent(parentDepartment);
        }
      } else {
        await department.setParent(null);
      }
    }
  }
}
