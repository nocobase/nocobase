/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { OriginRecord, SyncDataType, UserDataResource } from './user-data-resource-manager';

// TODO(yangqia): 在部门插件定义
export class DepartmentDataSyncResource extends UserDataResource {
  name = 'departments';
  accepts: SyncDataType[] = [
    {
      dataType: 'user',
      associateResource: 'users',
    },
    'department',
  ];

  get userRepo() {
    return this.db.getRepository('users');
  }

  get deptRepo() {
    return this.db.getRepository('departments');
  }

  async update(record: OriginRecord, resourcePk: number): Promise<void> {
    const { dataType, metaData, sourceName } = record;
    if (dataType === 'user') {
      const sourceUser = metaData;
      const user = await this.userRepo.findOne({
        filterByTk: resourcePk,
      });
      await this.updateUserDepartments(user, sourceUser.departments, sourceName);
    } else if (dataType === 'department') {
      const sourceDepartment = record;
      const department = await this.deptRepo.findOne({
        filterByTk: resourcePk,
      });
      await this.updateDepartment(department, sourceDepartment, sourceName);
    } else {
      this.logger.warn(`update department: unsupported data type: ${dataType}`);
    }
  }

  async create(record: OriginRecord, uniqueKey: string): Promise<string> {
    const { dataType, metaData, sourceName } = record;
    if (dataType === 'user') {
      return;
    } else if (dataType === 'department') {
      const sourceDepartment = metaData;
      return await this.createDepartment(sourceDepartment, sourceName);
    } else {
      this.logger.warn(`create department: unsupported data type: ${dataType}`);
    }
    return;
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
        filter: {
          sourceName,
          dataType: 'department',
          sourceUk: { $in: sourceDepartmentIds },
          'resources.resource': this.name,
        },
        appends: ['resources'],
      });
      const departmentIds = syncDepartmentRecords
        .filter((record) => record.resources?.length)
        .map((record) => record.resources[0].resourcePk);
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
    await this.updateParentDepartment(department, sourceDepartment.parentId, sourceName);
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
        filter: {
          sourceName,
          dataType: 'department',
          sourceUk: parentId,
          'resources.resource': this.name,
        },
        appends: ['resources'],
      });
      if (syncDepartmentRecord && syncDepartmentRecord.resources?.length) {
        const parentDepartment = await this.deptRepo.findOne({
          filterByTk: syncDepartmentRecord.resources[0].resourcePk,
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
