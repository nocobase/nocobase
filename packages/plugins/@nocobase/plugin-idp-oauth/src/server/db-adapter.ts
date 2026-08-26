/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '@nocobase/server';

function epochTime(date = Date.now()) {
  return Math.floor(date / 1000);
}

export function createDbAdapter(app: Application, collectionName = 'oidcStates') {
  return class DbAdapter {
    model: string;

    constructor(model: string) {
      this.model = model;
    }

    get repo() {
      return app.db.getRepository(collectionName);
    }

    isExpired(record?: any) {
      if (!record?.expiresAt) {
        return false;
      }
      const value =
        record.expiresAt instanceof Date ? record.expiresAt.getTime() : new Date(record.expiresAt).getTime();
      return value <= Date.now();
    }

    async destroyExpired(record?: any) {
      if (!record?.id) {
        return;
      }
      await this.repo.destroy({
        filterByTk: record.id,
      });
    }

    async findRecord(filter: Record<string, any>) {
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

      return record;
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

      await this.repo.destroy({
        filterByTk: record.get('id'),
      });
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
        ...(record.get('payload') || {}),
        consumed: epochTime(),
      };

      await this.repo.update({
        filterByTk: record.get('id'),
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

      return record?.get('payload');
    }

    async findByUid(uid: string) {
      const record = await this.findRecord({
        model: this.model,
        uid,
      });

      return record?.get('payload');
    }

    async findByUserCode(userCode: string) {
      const record = await this.findRecord({
        model: this.model,
        userCode,
      });

      return record?.get('payload');
    }

    async upsert(id: string, payload: Record<string, any>, expiresIn?: number) {
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
