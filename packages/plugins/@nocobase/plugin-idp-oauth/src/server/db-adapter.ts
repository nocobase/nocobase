/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '@nocobase/server';
import type { TargetKey } from '@nocobase/database';
import type { AdapterConstructor, AdapterPayload } from 'oidc-provider';

interface OidcStateRecord {
  id?: TargetKey;
  expiresAt?: Date | string | number | null;
  get(key: string): unknown;
}

function getPayload(record: OidcStateRecord): AdapterPayload | undefined {
  const payload = record.get('payload');

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  return payload as AdapterPayload;
}

function getRecordId(record: OidcStateRecord): TargetKey | undefined {
  const id = record.id ?? record.get('id');

  if (typeof id === 'string' || typeof id === 'number') {
    return id;
  }

  if (id && typeof id === 'object') {
    return id as TargetKey;
  }

  return undefined;
}

function epochTime(date = Date.now()) {
  return Math.floor(date / 1000);
}

export function createDbAdapter(app: Application, collectionName = 'oidcStates'): AdapterConstructor {
  return class DbAdapter {
    model: string;

    constructor(model: string) {
      this.model = model;
    }

    get repo() {
      return app.db.getRepository(collectionName);
    }

    isExpired(record?: OidcStateRecord) {
      if (!record?.expiresAt) {
        return false;
      }
      const value =
        record.expiresAt instanceof Date ? record.expiresAt.getTime() : new Date(record.expiresAt).getTime();
      return value <= Date.now();
    }

    async destroyExpired(record?: OidcStateRecord) {
      if (!record?.id) {
        return;
      }
      await this.repo.destroy({
        filterByTk: record.id,
      });
    }

    async findRecord(filter: Record<string, unknown>): Promise<OidcStateRecord | undefined> {
      const record = await this.repo.findOne({
        filter,
      });

      if (!record) {
        return undefined;
      }

      if (this.isExpired(record)) {
        await this.destroyExpired(record);
        return undefined;
      }

      return record as OidcStateRecord;
    }

    async destroy(id: string) {
      const record = await this.repo.findOne({
        filter: {
          model: this.model,
          oidcId: id,
        },
      });

      if (!record) {
        return;
      }

      const targetKey = getRecordId(record as OidcStateRecord);
      if (targetKey) {
        await this.repo.destroy({
          filterByTk: targetKey,
        });
      }
    }

    async consume(id: string) {
      const record = await this.findRecord({
        model: this.model,
        oidcId: id,
      });

      if (!record) {
        return;
      }

      const payload = {
        ...(getPayload(record) || {}),
        consumed: epochTime(),
      };

      const targetKey = getRecordId(record);
      if (!targetKey) {
        return;
      }

      await this.repo.update({
        filterByTk: targetKey,
        values: {
          payload,
          consumedAt: Math.floor(Date.now() / 1000),
        },
      });
    }

    async find(id: string) {
      const record = await this.findRecord({
        model: this.model,
        oidcId: id,
      });

      return record ? getPayload(record) : undefined;
    }

    async findByUid(uid: string) {
      const record = await this.findRecord({
        model: this.model,
        uid,
      });

      return record ? getPayload(record) : undefined;
    }

    async findByUserCode(userCode: string) {
      const record = await this.findRecord({
        model: this.model,
        userCode,
      });

      return record ? getPayload(record) : undefined;
    }

    async upsert(id: string, payload: AdapterPayload, expiresIn?: number) {
      await this.repo.updateOrCreate({
        filterKeys: ['model', 'oidcId'],
        values: {
          model: this.model,
          oidcId: id,
          payload,
          grantId: payload.grantId || null,
          uid: payload.uid || null,
          userCode: payload.userCode || null,
          expiresAt:
            typeof expiresIn === 'number' && Number.isFinite(expiresIn)
              ? Math.floor(Date.now() / 1000) + expiresIn
              : null,
        },
      });
    }

    async revokeByGrantId(grantId: string) {
      if (!grantId) {
        return;
      }

      await this.repo.destroy({
        filter: {
          grantId,
        },
      });
    }
  };
}
