/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import Database, { Repository } from '@nocobase/database';

export type UserData = {
  dataType: 'user' | 'department';
  uniqueKey: string;
  records: any[];
  sourceName: string;
};

export interface UserDataResource {
  accepts: ('user' | 'department')[];
  updateOrCreate(originRecords: any[]): Promise<{ newRecords: any[] }>;
}

export class UserDataResourceManager {
  resources: Registry<UserDataResource> = new Registry();
  syncRecordRepo: Repository;

  reigsterResource(name: string, resource: UserDataResource) {
    this.resources.register(name, resource);
  }

  set db(value: Database) {
    this.syncRecordRepo = value.getRepository('userDataSyncRecords');
  }

  async saveOriginRecords(data: UserData): Promise<void> {
    for (const record of data.records) {
      const sourceId = record.id;
      const syncRecord = await this.syncRecordRepo.findOne({
        where: {
          sourceName: data.sourceName,
          sourceId,
          resource: data.dataType,
        },
      });
      if (syncRecord) {
        syncRecord.lastMetaData = syncRecord.metaData;
        syncRecord.metaData = JSON.stringify(record);
        await syncRecord.save();
      } else {
        await this.syncRecordRepo.create({
          values: {
            sourceName: data.sourceName,
            resource: data.dataType,
            sourceId,
            sourceUniqueKey: data.uniqueKey,
            metaData: JSON.stringify(record),
          },
        });
      }
    }
  }

  async findOriginRecords({ resource, sourceName, sourceIds }): Promise<any[]> {
    return await this.syncRecordRepo.find({ filter: { sourceName, resource, sourceId: { $in: sourceIds } } });
  }

  async updateOriginRecords({ resource, sourceName, values }): Promise<void> {
    for (const value of values) {
      const syncRecord = await this.syncRecordRepo.findOne({
        filter: {
          sourceName,
          sourceId: value.sourceId,
          resource,
        },
      });
      if (syncRecord) {
        syncRecord.resourcePk = value.resourcePk;
        await syncRecord.save();
      }
    }
  }

  async updateOrCreate(data: UserData) {
    await this.saveOriginRecords(data);
    const { dataType, sourceName, records } = data;
    const sourceIds = records.map((record) => record.id);
    for (const resource of this.resources.getValues()) {
      if (resource.accepts.includes(dataType)) {
        const originRecords = await this.findOriginRecords({ resource: dataType, sourceName, sourceIds });
        const results = await resource.updateOrCreate(originRecords);
        await this.updateOriginRecords({ resource: dataType, sourceName, values: results.newRecords });
      }
    }
  }
}
