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
  FormatUser,
  OriginRecord,
  PrimaryKey,
  RecordResourceChanged,
  SyncAccept,
  UserDataResource,
} from '@nocobase/plugin-user-data-sync';

export class UserDataSyncResource extends UserDataResource {
  name = 'users';
  accepts: SyncAccept[] = ['user'];

  get userRepo() {
    return this.db.getRepository('users');
  }
  getFlteredSourceUser(sourceUser: FormatUser) {
    const deleteProps = [
      'id',
      'uid',
      'createdAt',
      'updatedAt',
      'appLang',
      'resetToken',
      'systemSettings',
      'password',
      'sort',
      'createdById',
      'updatedById',
      'isDeleted',
      'departments',
    ];
    return lodash.omit(sourceUser, deleteProps);
  }
  async updateUser(user: Model, sourceUser: FormatUser) {
    if (sourceUser.isDeleted) {
      // 删除用户
      const roles = await user.getRoles();
      // 是否有Root角色
      for (const role of roles) {
        if (role.name === 'root') {
          return;
        }
      }
      await user.destroy();
      return;
    }
    let dataChanged = false;
    const filteredSourceUser = this.getFlteredSourceUser(sourceUser);
    lodash.forOwn(filteredSourceUser, (value, key) => {
      if (user[key] !== value) {
        user[key] = value;
        dataChanged = true;
      }
    });
    if (dataChanged) {
      await user.save();
    }
  }

  async update(record: OriginRecord, resourcePks: PrimaryKey[], matchKey: string): Promise<RecordResourceChanged[]> {
    const { metaData: sourceUser } = record;
    const resourcePk = resourcePks[0];
    const user = await this.userRepo.findOne({
      filterByTk: resourcePk,
    });
    if (!user) {
      // 用户不存在, 重新创建用户
      const result = await this.create(record, matchKey);
      return [...result, { resourcesPk: resourcePk, isDeleted: true }];
    }
    await this.updateUser(user, sourceUser);
    return [];
  }

  async create(record: OriginRecord, matchKey: string): Promise<RecordResourceChanged[]> {
    const { metaData: sourceUser } = record;
    const filter = {};
    let user: any;
    if (['phone', 'email', 'username'].includes(matchKey)) {
      filter[matchKey] = sourceUser[matchKey];
      user = await this.userRepo.findOne({
        filter,
      });
    }
    if (user) {
      await this.updateUser(user, sourceUser);
    } else {
      const filteredSourceUser = this.getFlteredSourceUser(sourceUser);
      user = await this.userRepo.create({
        values: filteredSourceUser,
      });
    }
    return [{ resourcesPk: user.id, isDeleted: false }];
  }
}
