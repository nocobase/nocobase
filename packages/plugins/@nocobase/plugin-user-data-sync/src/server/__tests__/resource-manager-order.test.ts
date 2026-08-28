/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type Database from '@nocobase/database';
import type { SystemLogger } from '@nocobase/logger';
import { describe, expect, it, vi } from 'vitest';
import {
  OriginRecord,
  PrimaryKey,
  RecordResourceChanged,
  SyncAccept,
  SyncDataType,
  UserDataRecord,
  UserDataResource,
  UserDataResourceManager,
} from '../user-data-resource-manager';

type StoredOriginRecord = OriginRecord & {
  lastMetaData?: UserDataRecord;
  save: () => Promise<void>;
  createResource: (values: { resource: string; resourcePk: PrimaryKey }) => Promise<void>;
};

class OrderedDepartmentResource extends UserDataResource {
  name = 'departments';
  accepts: SyncAccept[] = ['department'];
  calls: string[] = [];

  constructor() {
    super({} as Database, { debug: vi.fn(), warn: vi.fn() } as unknown as SystemLogger);
  }

  async update(record: OriginRecord): Promise<RecordResourceChanged[]> {
    this.calls.push(`update:${record.sourceUk}`);
    return [];
  }

  async create(record: OriginRecord): Promise<RecordResourceChanged[]> {
    this.calls.push(`create:${record.sourceUk}`);
    return [{ resourcesPk: record.sourceUk, isDeleted: false }];
  }
}

function createStoredRecord(values: {
  id: number;
  sourceName: string;
  sourceUk: string;
  dataType: SyncDataType;
  metaData: UserDataRecord;
  resources?: OriginRecord['resources'];
}): StoredOriginRecord {
  const record: StoredOriginRecord = {
    ...values,
    resources: values.resources ?? [],
    save: vi.fn(async () => undefined),
    createResource: vi.fn(async ({ resource, resourcePk }) => {
      record.resources.push({
        resource,
        resourcePk: String(resourcePk),
      });
    }),
  };
  return record;
}

describe('user-data-resource-manager record order', () => {
  it('processes resources in the same order as incoming records', async () => {
    const manager = new UserDataResourceManager();
    const resource = new OrderedDepartmentResource();
    const storedRecords = new Map<string, StoredOriginRecord>();
    let nextId = 2;

    storedRecords.set(
      '20',
      createStoredRecord({
        id: 1,
        sourceName: 'test',
        sourceUk: '20',
        dataType: 'department',
        metaData: {
          uid: '20',
          title: 'child',
          parentUid: '0',
        },
        resources: [{ resource: 'departments', resourcePk: 'child-department-id' }],
      }),
    );

    manager.syncRecordRepo = {
      findOne: vi.fn(
        async ({
          where,
          filter,
        }: {
          where?: { sourceName: string; sourceUk: string; dataType: SyncDataType };
          filter?: { id?: number };
        }) => {
          if (where) {
            return storedRecords.get(where.sourceUk);
          }
          if (filter?.id != null) {
            return Array.from(storedRecords.values()).find((record) => record.id === filter.id);
          }
          return undefined;
        },
      ),
      create: vi.fn(
        async ({
          values,
        }: {
          values: { sourceName: string; sourceUk: string; dataType: SyncDataType; metaData: UserDataRecord };
        }) => {
          const record = createStoredRecord({
            id: nextId,
            sourceName: values.sourceName,
            sourceUk: values.sourceUk,
            dataType: values.dataType,
            metaData: values.metaData,
          });
          nextId += 1;
          storedRecords.set(values.sourceUk, record);
          return record;
        },
      ),
      find: vi.fn(
        async ({ filter }: { filter: { sourceName: string; dataType: SyncDataType; sourceUk: { $in: string[] } } }) => {
          return ['20', '10']
            .map((sourceUk) => storedRecords.get(sourceUk))
            .filter((record): record is StoredOriginRecord => {
              return Boolean(
                record &&
                  record.sourceName === filter.sourceName &&
                  record.dataType === filter.dataType &&
                  filter.sourceUk.$in.includes(record.sourceUk),
              );
            });
        },
      ),
    } as unknown as UserDataResourceManager['syncRecordRepo'];
    manager.syncRecordResourceRepo = {} as UserDataResourceManager['syncRecordResourceRepo'];
    manager.registerResource(resource);

    await manager.updateOrCreate({
      sourceName: 'test',
      dataType: 'department',
      records: [
        {
          uid: '10',
          title: 'parent',
          parentUid: '0',
        },
        {
          uid: '20',
          title: 'child',
          parentUid: '10',
        },
      ],
    });

    expect(resource.calls).toEqual(['create:10', 'update:20']);
  });
});
