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
  update(originRecord: any): Promise<void>;
  create(originRecord: any, uniqueKey: string): Promise<string>;
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
      const sourceUk = record[data.uniqueKey];
      const syncRecord = await this.syncRecordRepo.findOne({
        where: {
          sourceName: data.sourceName,
          sourceUk,
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
            sourceUk,
            metaData: JSON.stringify(record),
          },
        });
      }
    }
  }

  async findOriginRecords({ resource, sourceName, sourceUks }): Promise<any[]> {
    return await this.syncRecordRepo.find({ filter: { sourceName, resource, sourceUk: { $in: sourceUks } } });
  }

  async updateOriginRecord({ resource, sourceName, sourceUk, resourcePk }): Promise<void> {
    const syncRecord = await this.syncRecordRepo.findOne({
      filter: {
        sourceName,
        sourceUk,
        resource,
      },
    });
    if (syncRecord) {
      syncRecord.resourcePk = resourcePk;
      await syncRecord.save();
    }
  }

  async updateOrCreate(data: UserData) {
    await this.saveOriginRecords(data);
    const { dataType, sourceName, records, uniqueKey } = data;
    const sourceUks = records.map((record) => record[uniqueKey]);
    for (const resource of this.resources.getValues()) {
      if (resource.accepts.includes(dataType)) {
        const originRecords = await this.findOriginRecords({ resource: dataType, sourceName, sourceUks });
        if (originRecords && originRecords.length > 0) {
          for (const originRecord of originRecords) {
            if (originRecord.resourcePk) {
              await resource.update(originRecord);
            } else {
              const resourcePk = await resource.create(originRecord, uniqueKey);
              await this.updateOriginRecord({
                resource: dataType,
                sourceName,
                sourceUk: originRecord.sourceUk,
                resourcePk,
              });
            }
          }
        }
      }
    }
  }
}
