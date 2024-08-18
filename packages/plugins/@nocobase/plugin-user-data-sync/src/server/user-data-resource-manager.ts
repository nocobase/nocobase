/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Toposort, ToposortOptions } from '@nocobase/utils';
import Database, { Repository } from '@nocobase/database';
import { SystemLogger } from '@nocobase/logger';

export type FormatUser = {
  uid: string;
  username?: string;
  email?: string;
  nickname?: string;
  phone?: string;
  departments?: string[];
  isDeleted?: boolean;
  [key: string]: any;
};

export type FormatDepartment = {
  uid: string;
  title?: string;
  parentId?: string;
  isDeleted?: boolean;
  [key: string]: any;
};

export type UserDataRecord = FormatUser | FormatDepartment;

export type SyncDataType = 'user' | 'department';

export type SyncAccept =
  | SyncDataType
  | {
      dataType: SyncDataType;
      // set resource name if this data type is associate with other resource
      associateResource: string;
    };

export type OriginRecord = {
  id: number;
  sourceName: string;
  sourceUk: string;
  dataType: SyncDataType;
  metaData: UserDataRecord;
  resources: {
    resource: string;
    resourcePk: string;
  }[];
};

export type UserData = {
  dataType: SyncDataType;
  matchKey?: string;
  records: UserDataRecord[];
  sourceName: string;
};

export type PrimaryKey = number | string;

export type RecordResourceChanged = {
  resourcesPk: PrimaryKey;
  isDeleted: boolean;
};

export abstract class UserDataResource {
  name: string;
  accepts: SyncAccept[];
  db: Database;
  logger: SystemLogger;

  constructor(db: Database, logger: SystemLogger) {
    this.db = db;
    this.logger = logger;
  }

  abstract update(record: OriginRecord, resourcePks: PrimaryKey[]): Promise<RecordResourceChanged[]>;
  abstract create(record: OriginRecord, matchKey: string): Promise<RecordResourceChanged[]>;

  get syncRecordRepo() {
    return this.db.getRepository('userDataSyncRecords');
  }

  get syncRecordResourceRepo() {
    return this.db.getRepository('userDataSyncRecordsResources');
  }

  parseAccepts(dataType: SyncDataType) {
    const accept = this.accepts.filter((accept) => {
      if (typeof accept === 'string') {
        return accept === dataType;
      }
      return accept.dataType === dataType;
    });
    if (!accept.length) {
      return null;
    }
    if (typeof accept[0] === 'string') {
      return this.name;
    }
    return accept[0].associateResource;
  }
}
export class UserDataResourceManager {
  resources = new Toposort<UserDataResource>();
  syncRecordRepo: Repository;
  syncRecordResourceRepo: Repository;

  registerResource(resource: UserDataResource, options?: ToposortOptions) {
    if (!resource.name) {
      throw new Error('"name" for user data synchronize resource is required');
    }
    if (!resource.accepts) {
      throw new Error('"accepts" for user data synchronize resource is required');
    }
    this.resources.add(resource, { tag: resource.name, ...options });
  }

  set db(value: Database) {
    this.syncRecordRepo = value.getRepository('userDataSyncRecords');
    this.syncRecordResourceRepo = value.getRepository('userDataSyncRecordsResources');
  }

  async saveOriginRecords(data: UserData): Promise<void> {
    for (const record of data.records) {
      const syncRecord = await this.syncRecordRepo.findOne({
        where: {
          sourceName: data.sourceName,
          sourceUk: record.uid,
          dataType: data.dataType,
        },
      });
      if (syncRecord) {
        syncRecord.lastMetaData = syncRecord.metaData;
        syncRecord.metaData = record;
        await syncRecord.save();
      } else {
        await this.syncRecordRepo.create({
          values: {
            sourceName: data.sourceName,
            sourceUk: record.uid,
            dataType: data.dataType,
            metaData: record,
          },
        });
      }
    }
  }

  async findOriginRecords({ sourceName, dataType, sourceUks }): Promise<OriginRecord[]> {
    return await this.syncRecordRepo.find({
      appends: ['resources'],
      filter: { sourceName, dataType, sourceUk: { $in: sourceUks } },
    });
  }

  async addResourceToOriginRecord({ recordId, resource, resourcePk }): Promise<void> {
    const syncRecord = await this.syncRecordRepo.findOne({
      filter: {
        id: recordId,
      },
    });
    if (syncRecord) {
      await syncRecord.createResource({
        resource,
        resourcePk,
      });
    }
  }

  async removeResourceFromOriginRecord({ recordId, resource, resourcePk }): Promise<void> {
    const recordResource = await this.syncRecordResourceRepo.findOne({
      where: {
        recordId,
        resource,
        resourcePk,
      },
    });
    if (recordResource) {
      await recordResource.destroy();
    }
  }

  async updateOrCreate(data: UserData) {
    await this.saveOriginRecords(data);
    const { dataType, sourceName, records, matchKey } = data;
    const sourceUks = records.map((record) => record.uid);
    for (const resource of this.resources.nodes) {
      const associateResource = resource.parseAccepts(dataType);
      if (!associateResource) {
        continue;
      }
      const originRecords = await this.findOriginRecords({ sourceName, sourceUks, dataType });
      if (!(originRecords && originRecords.length)) {
        continue;
      }
      for (const originRecord of originRecords) {
        const resourceRecords = originRecord.resources?.filter(
          (r: { resource: string }) => r.resource === associateResource,
        );
        let recordResourceChangeds: RecordResourceChanged[];
        if (resourceRecords && resourceRecords.length > 0) {
          const resourcePks = resourceRecords.map((r: { resourcePk: string }) => r.resourcePk);
          recordResourceChangeds = await resource.update(originRecord, resourcePks);
        } else {
          recordResourceChangeds = await resource.create(originRecord, matchKey);
        }
        if (!recordResourceChangeds || recordResourceChangeds.length === 0) {
          continue;
        }
        for (const { resourcesPk, isDeleted } of recordResourceChangeds) {
          if (isDeleted) {
            await this.removeResourceFromOriginRecord({
              recordId: originRecord.id,
              resource: associateResource,
              resourcePk: resourcesPk,
            });
          } else {
            await this.addResourceToOriginRecord({
              recordId: originRecord.id,
              resource: associateResource,
              resourcePk: resourcesPk,
            });
          }
        }
      }
    }
  }
}
