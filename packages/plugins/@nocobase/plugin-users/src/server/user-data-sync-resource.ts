/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { FormatUser, OriginRecord, SyncDataType, UserDataResource } from '@nocobase/plugin-user-data-sync';

export class UserDataSyncResource extends UserDataResource {
  name = 'users';
  accepts: SyncDataType[] = ['user'];

  get userRepo() {
    return this.db.getRepository('users');
  }

  async updateUser(user: Model, sourceUser: FormatUser) {
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
  }

  async update(record: OriginRecord, resourcePk: number) {
    const { metaData: sourceUser } = record;
    const user = await this.userRepo.findOne({
      filterByTk: resourcePk,
    });
    await this.updateUser(user, sourceUser);
  }

  async create(record: OriginRecord, uniqueKey: string): Promise<number> {
    const { metaData: sourceUser } = record;
    const filter = {};
    if (uniqueKey === 'id') {
      filter['username'] = sourceUser[uniqueKey];
    } else {
      filter[uniqueKey] = sourceUser[uniqueKey];
    }
    let user = await this.userRepo.findOne({
      filter,
    });
    if (user) {
      await this.updateUser(user, sourceUser);
      return user.id;
    } else {
      user = await this.userRepo.create({
        values: {
          nickname: sourceUser.nickname,
          phone: sourceUser.phone,
          email: sourceUser.email,
          username: uniqueKey === 'id' ? sourceUser.id : undefined,
        },
      });
    }
    return user.id;
  }
}
