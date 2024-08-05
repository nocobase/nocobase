/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { IUserDataResource, UserData } from './user-data-resource';

export class UserDataResourceManager {
  resources: Registry<IUserDataResource> = new Registry();

  reigsterResource(name: string, resource: IUserDataResource) {
    this.resources.register(name, resource);
  }

  async updateOrCreate(datas: UserData[]) {
    if (!datas.length) {
      return;
    }
    const userDatas = datas.filter((data) => data.type === 'user');
    const departmentDatas = datas.filter((data) => data.type === 'department');
    for (const userData of departmentDatas) {
      for (const dataResource of this.resources.getValues()) {
        if (dataResource.accepts.includes(userData.type)) {
          await dataResource.updateOrCreate(userData);
        }
      }
    }
    for (const userData of userDatas) {
      for (const dataResource of this.resources.getValues()) {
        if (dataResource.accepts.includes(userData.type)) {
          await dataResource.updateOrCreate(userData);
        }
      }
    }
  }
}
