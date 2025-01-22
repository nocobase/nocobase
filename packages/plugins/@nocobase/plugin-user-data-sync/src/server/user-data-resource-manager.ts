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
  departments?: (string | FormatUserDepartment)[];
  isDeleted?: boolean;
  [key: string]: any;
};

export type FormatDepartment = {
  uid: string;
  title?: string;
  parentUid?: string;
  isDeleted?: boolean;
  [key: string]: any;
};

export type FormatUserDepartment = {
  uid: string;
  isOwner?: boolean;
  isMain?: boolean;
};

export type UserDataRecord = FormatUser | FormatDepartment;

export type SyncDataType = 'user' | 'department';

export type SyncAccept = SyncDataType;

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

  abstract update(record: OriginRecord, resourcePks: PrimaryKey[], matchKey?: string): Promise<RecordResourceChanged[]>;
  abstract create(record: OriginRecord, matchKey: string): Promise<RecordResourceChanged[]>;

  get syncRecordRepo() {
    return this.db.getRepository('userDataSyncRecords');
  }

  get syncRecordResourceRepo() {
    return this.db.getRepository('userDataSyncRecordsResources');
  }
}

export type SyncResult = {
  resource: string;
  detail: {
    count: {
      all: number;
      success: number;
      failed: number;
    };
    failedRecords: {
      record: UserDataRecord;
      message: string;
    }[];
  };
};

export class UserDataResourceManager {
  resources = new Toposort<UserDataResource>();
  syncRecordRepo: Repository;
  syncRecordResourceRepo: Repository;
  logger: SystemLogger;

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
      if (record.uid === undefined) {
        throw new Error(`record must has uid, error record: ${JSON.stringify(record)}`);
      }
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

  async updateOrCreate(data: UserData): Promise<SyncResult[]> {
    await this.saveOriginRecords(data);
    const { dataType, sourceName, records, matchKey } = data;
    const sourceUks = records.map((record) => record.uid);
    const syncResults: SyncResult[] = [];
    for (const resource of this.resources.nodes) {
      if (!resource.accepts.includes(dataType)) {
        continue;
      }
      const associateResource = resource.name;
      const originRecords = await this.findOriginRecords({ sourceName, sourceUks, dataType });
      if (!(originRecords && originRecords.length)) {
        continue;
      }
      const successRecords = [];
      const failedRecords = [];
      for (const originRecord of originRecords) {
        const resourceRecords = originRecord.resources?.filter(
          (r: { resource: string }) => r.resource === associateResource,
        );
        let recordResourceChangeds: RecordResourceChanged[];
        if (resourceRecords && resourceRecords.length > 0) {
          const resourcePks = resourceRecords.map((r: { resourcePk: string }) => r.resourcePk);
          try {
            recordResourceChangeds = await resource.update(originRecord, resourcePks, matchKey);
            this.logger?.debug(`update record success. Data changed: ${JSON.stringify(recordResourceChangeds)}`);
            successRecords.push(originRecord.metaData);
          } catch (error) {
            this.logger?.warn(`update record error: ${error.message}`, { originRecord });
            failedRecords.push({ record: originRecord.metaData, message: error.message });
            continue;
          }
        } else {
          try {
            recordResourceChangeds = await resource.create(originRecord, matchKey);
            this.logger?.debug(`create record success. Data changed: ${JSON.stringify(recordResourceChangeds)}`);
            successRecords.push(originRecord.metaData);
          } catch (error) {
            this.logger?.warn(`create record error: ${error.message}`, { originRecord });
            failedRecords.push({ record: originRecord.metaData, message: error.message });
            continue;
          }
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
      syncResults.push({
        resource: associateResource,
        detail: {
          count: {
            all: originRecords.length,
            success: successRecords.length,
            failed: failedRecords.length,
          },
          failedRecords,
        },
      });
    }
    return syncResults;
  }
}
