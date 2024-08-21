/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import {
  FormatDepartment,
  OriginRecord,
  PrimaryKey,
  RecordResourceChanged,
  SyncAccept,
  UserDataResource,
} from './user-data-resource-manager';

export class DepartmentDataSyncResource extends UserDataResource {
  name = 'departments';
  accepts: SyncAccept[] = [
    {
      dataType: 'user',
      associateResource: 'department',
    },
    'department',
  ];

  get userRepo() {
    return this.db.getRepository('users');
  }

  get deptRepo() {
    return this.db.getRepository('departments');
  }

  async update(record: OriginRecord, resourcePks: PrimaryKey[]): Promise<RecordResourceChanged[]> {
    const { dataType, metaData, sourceName } = record;
    if (dataType === 'user') {
      const sourceUser = metaData;
      const resources = record.resources.filter((r) => r.resource === 'users');
      if (!resources.length) {
        return [];
      }
      const user = await this.userRepo.findOne({
        filterByTk: resources[0].resourcePk,
      });
      await this.updateUserDepartments(user, resourcePks, sourceUser.departments);
    } else if (dataType === 'department') {
      const sourceDepartment = metaData;
      const department = await this.deptRepo.findOne({
        filterByTk: resourcePks[0],
      });
      await this.updateDepartment(department, sourceDepartment, sourceName);
    } else {
      this.logger.warn(`update department: unsupported data type: ${dataType}`);
    }
    return [];
  }

  async create(record: OriginRecord, matchKey: string): Promise<RecordResourceChanged[]> {
    const { dataType, metaData, sourceName } = record;
    if (dataType === 'user') {
      return [];
    } else if (dataType === 'department') {
      const sourceDepartment = metaData;
      const newDepartmentId = await this.createDepartment(sourceDepartment, sourceName);
      return [{ resourcesPk: newDepartmentId, isDeleted: false }];
    } else {
      this.logger.warn(`create department: unsupported data type: ${dataType}`);
    }
    return [];
  }

  async updateUserDepartments(
    user: any,
    currentDepartmentIds: PrimaryKey[],
    sourceDepartmentIds: PrimaryKey[],
  ): Promise<RecordResourceChanged[]> {
    if (!this.deptRepo) {
      return;
    }
    if (!sourceDepartmentIds || !sourceDepartmentIds.length) {
      const userDepartments = await user.getDepartments();
      if (userDepartments.length) {
        await user.removeDepartments(userDepartments);
        return userDepartments.map((department) => {
          return {
            resourcesPk: department.id,
            isDeleted: true,
          };
        });
      }
    } else {
      const departments = await this.deptRepo.find({ filter: { id: { $in: sourceDepartmentIds } } });
      const userDepartments = await this.deptRepo.find({ filter: { id: { $in: currentDepartmentIds } } });
      // 需要删除的部门
      const toRemoveDepartments = userDepartments.filter((department) => {
        return !departments.find((sourceDepartment) => sourceDepartment.id === department.id);
      });
      const recordResourceChangeds: RecordResourceChanged[] = [];
      if (toRemoveDepartments.length) {
        await user.removeDepartments(toRemoveDepartments);
        recordResourceChangeds.push(
          ...toRemoveDepartments.map((department) => {
            return {
              resourcesPk: department.id,
              isDeleted: true,
            };
          }),
        );
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
        recordResourceChangeds.push(
          ...toAddDepartments.map((department) => {
            return {
              resourcesPk: department.id,
              isDeleted: false,
            };
          }),
        );
      }
      return recordResourceChangeds;
    }
  }

  async updateDepartment(department: Model, sourceDepartment: FormatDepartment, sourceName: string) {
    if (sourceDepartment.isDeleted) {
      // 删除部门
      await department.destroy();
      return;
    }
    let dataChanged = false;
    if (sourceDepartment.title !== undefined && department.title !== sourceDepartment.title) {
      department.title = sourceDepartment.title;
      dataChanged = true;
    }
    if (dataChanged) {
      await department.save();
    }
    await this.updateParentDepartment(department, sourceDepartment.parentId, sourceName);
  }

  async createDepartment(sourceDepartment: FormatDepartment, sourceName: string): Promise<string> {
    const department = await this.deptRepo.create({
      values: {
        title: sourceDepartment.title,
      },
    });
    await this.updateParentDepartment(department, sourceDepartment.parentId, sourceName);
    return department.id;
  }

  async updateParentDepartment(department: Model, parentId: string, sourceName: string) {
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
