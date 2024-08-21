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

  async updateUser(user: Model, sourceUser: FormatUser) {
    if (sourceUser.isDeleted) {
      // 删除用户
      const roles = await user.getRoles();
      // 是否有Root角色
      for (const role of roles) {
        if (role.name === 'Root') {
          return;
        }
      }
      await user.destroy();
      return;
    }
    let dataChanged = false;
    if (sourceUser.username !== undefined && user.username !== sourceUser.username) {
      user.username = sourceUser.username;
      dataChanged = true;
    }
    if (sourceUser.phone !== undefined && user.phone !== sourceUser.phone) {
      user.phone = sourceUser.phone;
      dataChanged = true;
    }
    if (sourceUser.email !== undefined && user.email !== sourceUser.email) {
      user.email = sourceUser.email;
      dataChanged = true;
    }
    if (sourceUser.nickname !== undefined && user.nickname !== sourceUser.nickname) {
      user.nickname = sourceUser.nickname;
      dataChanged = true;
    }
    if (dataChanged) {
      await user.save();
    }
  }

  async update(record: OriginRecord, resourcePks: PrimaryKey[]): Promise<RecordResourceChanged[]> {
    const { metaData: sourceUser } = record;
    const resourcePk = resourcePks[0];
    const user = await this.userRepo.findOne({
      filterByTk: resourcePk,
    });
    await this.updateUser(user, sourceUser);
    return [];
  }

  async create(record: OriginRecord, matchKey: string, associateResource: string): Promise<RecordResourceChanged[]> {
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
      user = await this.userRepo.create({
        values: {
          nickname: sourceUser.nickname,
          phone: sourceUser.phone,
          email: sourceUser.email,
          username: sourceUser.username,
        },
      });
    }
    return [{ resourcesPk: user.id, isDeleted: false }];
  }
}
