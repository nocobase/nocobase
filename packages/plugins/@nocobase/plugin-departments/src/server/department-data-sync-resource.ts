/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import lodash from 'lodash';
import {
  FormatDepartment,
  FormatUserDepartment,
  OriginRecord,
  PrimaryKey,
  RecordResourceChanged,
  SyncAccept,
  UserDataResource,
} from '@nocobase/plugin-user-data-sync';

export class DepartmentDataSyncResource extends UserDataResource {
  name = 'departments';
  accepts: SyncAccept[] = ['user', 'department'];

  get userRepo() {
    return this.db.getRepository('users');
  }

  get deptRepo() {
    return this.db.getRepository('departments');
  }

  get deptUserRepo() {
    return this.db.getRepository('departmentsUsers');
  }

  getFlteredSourceDepartment(sourceDepartment: FormatDepartment) {
    const deleteProps = [
      'id',
      'uid',
      'createdAt',
      'updatedAt',
      'sort',
      'createdById',
      'updatedById',
      'isDeleted',
      'parentId',
      'parentUid',
    ];
    return lodash.omit(sourceDepartment, deleteProps);
  }

  async update(record: OriginRecord, resourcePks: PrimaryKey[]): Promise<RecordResourceChanged[]> {
    const { dataType, metaData, sourceName } = record;
    if (dataType === 'user') {
      const sourceUser = metaData;
      if (sourceUser.isDeleted) {
        if (!resourcePks || !resourcePks.length) {
          return [];
        } else {
          return resourcePks.map((id) => ({ resourcesPk: id, isDeleted: true }));
        }
      }
      const resources = record.resources.filter((r) => r.resource === 'users');
      if (!resources.length) {
        return [];
      }
      const user = await this.userRepo.findOne({
        filterByTk: resources[0].resourcePk,
      });
      if (!user) {
        if (!resourcePks || !resourcePks.length) {
          return [];
        } else {
          return resourcePks.map((id) => ({ resourcesPk: id, isDeleted: true }));
        }
      } else {
        return await this.updateUserDepartments(user, resourcePks, sourceUser.departments, sourceName);
      }
    } else if (dataType === 'department') {
      const sourceDepartment = metaData;
      const department = await this.deptRepo.findOne({
        filterByTk: resourcePks[0],
      });
      if (!department) {
        if (sourceDepartment.isDeleted) {
          return [{ resourcesPk: resourcePks[0], isDeleted: true }];
        }
        const result = await this.create(record);
        return [...result, { resourcesPk: resourcePks[0], isDeleted: true }];
      }
      await this.updateDepartment(department, sourceDepartment, sourceName);
    } else {
      this.logger.warn(`update department: unsupported data type: ${dataType}`);
    }
    return [];
  }

  async create(record: OriginRecord): Promise<RecordResourceChanged[]> {
    const { dataType, metaData, sourceName } = record;
    if (dataType === 'user') {
      const sourceUser = metaData;
      if (sourceUser.isDeleted) {
        return [];
      }
      const resources = record.resources.filter((r) => r.resource === 'users');
      if (!resources.length) {
        return [];
      }
      const user = await this.userRepo.findOne({
        filterByTk: resources[0].resourcePk,
      });
      return await this.updateUserDepartments(user, [], sourceUser.departments, sourceName);
    } else if (dataType === 'department') {
      const sourceDepartment = metaData;
      const newDepartmentId = await this.createDepartment(sourceDepartment, sourceName);
      return [{ resourcesPk: newDepartmentId, isDeleted: false }];
    } else {
      this.logger.warn(`create department: unsupported data type: ${dataType}`);
    }
    return [];
  }

  async getDepartmentIdsBySourceUks(sourceUks: PrimaryKey[], sourceName: string) {
    const syncDepartmentRecords = await this.syncRecordRepo.find({
      filter: {
        sourceName,
        dataType: 'department',
        sourceUk: { $in: sourceUks },
        'resources.resource': this.name,
      },
      appends: ['resources'],
    });
    const departmentIds = syncDepartmentRecords
      .filter((record) => record.resources?.length)
      .map((record) => record.resources[0].resourcePk);
    return departmentIds;
  }

  async getDepartmentIdBySourceUk(sourceUk: PrimaryKey, sourceName: string) {
    const syncDepartmentRecord = await this.syncRecordRepo.findOne({
      filter: {
        sourceName,
        dataType: 'department',
        sourceUk,
        'resources.resource': this.name,
      },
      appends: ['resources'],
    });
    if (syncDepartmentRecord && syncDepartmentRecord.resources?.length) {
      return syncDepartmentRecord.resources[0].resourcePk;
    }
  }

  async updateUserDepartments(
    user: any,
    currentDepartmentIds: PrimaryKey[],
    sourceDepartments: (PrimaryKey | FormatUserDepartment)[],
    sourceName: string,
  ): Promise<RecordResourceChanged[]> {
    if (!this.deptRepo) {
      return [];
    }
    if (!sourceDepartments || !sourceDepartments.length) {
      const userDepartments = await user.getDepartments();
      if (userDepartments.length) {
        await user.removeDepartments(userDepartments);
      }
      if (currentDepartmentIds && currentDepartmentIds.length) {
        return currentDepartmentIds.map((id) => ({ resourcesPk: id, isDeleted: true }));
      } else {
        return [];
      }
    } else {
      const sourceDepartmentIds = sourceDepartments.map((sourceDepartment) => {
        if (typeof sourceDepartment === 'string' || typeof sourceDepartment === 'number') {
          return sourceDepartment;
        }
        return sourceDepartment.uid;
      });
      const newDepartmentIds = await this.getDepartmentIdsBySourceUks(sourceDepartmentIds, sourceName);
      const newDepartments = await this.deptRepo.find({
        filter: { id: { $in: newDepartmentIds } },
      });
      const realCurrentDepartments = await user.getDepartments();
      // 需要删除的部门
      const toRealRemoveDepartments = realCurrentDepartments.filter((currnetDepartment) => {
        return !newDepartments.find((newDepartment) => newDepartment.id === currnetDepartment.id);
      });
      if (toRealRemoveDepartments.length) {
        await user.removeDepartments(toRealRemoveDepartments);
      }
      // 需要添加的部门
      const toRealAddDepartments = newDepartments.filter((newDepartment) => {
        if (realCurrentDepartments.length === 0) {
          return true;
        }
        return !realCurrentDepartments.find((currentDepartment) => currentDepartment.id === newDepartment.id);
      });
      if (toRealAddDepartments.length) {
        await user.addDepartments(toRealAddDepartments);
      }
      // 更新部门主管和主部门
      for (const sourceDepartment of sourceDepartments) {
        this.logger.debug('update dept owner: ' + JSON.stringify(sourceDepartment));
        let isOwner = false;
        let isMain = false;
        let uid;
        if (typeof sourceDepartment !== 'string' && typeof sourceDepartment !== 'number') {
          isOwner = sourceDepartment.isOwner || false;
          isMain = sourceDepartment.isMain || false;
          uid = sourceDepartment.uid;
        } else {
          uid = sourceDepartment;
        }
        const deptId = await this.getDepartmentIdBySourceUk(uid, sourceName);
        this.logger.debug('update dept owner: ' + JSON.stringify({ deptId, isOwner, isMain, userId: user.id }));
        if (!deptId) {
          continue;
        }
        await this.deptUserRepo.update({
          filter: {
            userId: user.id,
            departmentId: deptId,
          },
          values: {
            isOwner,
            isMain,
          },
        });
      }
      const recordResourceChangeds: RecordResourceChanged[] = [];
      if (currentDepartmentIds !== undefined && currentDepartmentIds.length > 0) {
        // 需要删除的部门ID
        const toRemoveDepartmentIds = currentDepartmentIds.filter(
          (currentDepartmentId) => !newDepartmentIds.includes(currentDepartmentId),
        );
        recordResourceChangeds.push(
          ...toRemoveDepartmentIds.map((departmentId) => {
            return { resourcesPk: departmentId, isDeleted: true };
          }),
        );
        // 需要添加的部门ID
        const toAddDepartmentIds = newDepartmentIds.filter(
          (newDepartmentId) => !currentDepartmentIds.includes(newDepartmentId),
        );
        recordResourceChangeds.push(
          ...toAddDepartmentIds.map((departmentId) => {
            return { resourcesPk: departmentId, isDeleted: false };
          }),
        );
      } else {
        recordResourceChangeds.push(
          ...toRealAddDepartments.map((department) => {
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
    const filteredSourceDepartment = this.getFlteredSourceDepartment(sourceDepartment);
    lodash.forOwn(filteredSourceDepartment, (value, key) => {
      if (department[key] !== value) {
        department[key] = value;
        dataChanged = true;
      }
    });
    if (dataChanged) {
      await department.save();
    }
    await this.updateParentDepartment(department, sourceDepartment.parentUid, sourceName);
  }

  async createDepartment(sourceDepartment: FormatDepartment, sourceName: string): Promise<string> {
    const filteredSourceDepartment = this.getFlteredSourceDepartment(sourceDepartment);
    const department = await this.deptRepo.create({
      values: filteredSourceDepartment,
    });
    await this.updateParentDepartment(department, sourceDepartment.parentUid, sourceName);
    return department.id;
  }

  async updateParentDepartment(department: Model, parentUid: string, sourceName: string) {
    if (!parentUid) {
      const parentDepartment = await department.getParent();
      if (parentDepartment) {
        await department.setParent(null);
      }
    } else {
      const syncDepartmentRecord = await this.syncRecordRepo.findOne({
        filter: {
          sourceName,
          dataType: 'department',
          sourceUk: parentUid,
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
