/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Cache } from '@nocobase/cache';

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

type StoredPayload = Record<string, any> & {
  __expiresAt?: number;
};

function epochTime(date = Date.now()) {
  return Math.floor(date / 1000);
}

export function createCacheAdapter(cache: Cache, namespace: string) {
  const keyFor = (model: string, id: string) => `${namespace}:${model}:${id}`;
  const grantKeyFor = (grantId: string) => `${namespace}:grant:${grantId}`;
  const sessionUidKeyFor = (uid: string) => `${namespace}:sessionUid:${uid}`;
  const userCodeKeyFor = (userCode: string) => `${namespace}:userCode:${userCode}`;

  const normalize = (payload?: StoredPayload) => {
    if (!payload) {
      return undefined;
    }

    if (payload.__expiresAt && payload.__expiresAt <= Date.now()) {
      return undefined;
    }

    const { __expiresAt, ...data } = payload;
    return data;
  };

  const getRemainingTtl = (payload?: StoredPayload) => {
    if (!payload?.__expiresAt) {
      return undefined;
    }

    const ttl = payload.__expiresAt - Date.now();
    return ttl > 0 ? ttl : undefined;
  };

  return class CacheAdapter {
    model: string;

    constructor(model: string) {
      this.model = model;
    }

    key(id: string) {
      return keyFor(this.model, id);
    }

    async read(id: string) {
      const payload = await cache.get<StoredPayload>(this.key(id));
      if (!payload) {
        return undefined;
      }

      if (payload.__expiresAt && payload.__expiresAt <= Date.now()) {
        await this.destroy(id);
        return undefined;
      }

      return payload;
    }

    async destroy(id: string) {
      const payload = await cache.get<StoredPayload>(this.key(id));
      await cache.del(this.key(id));

      if (payload?.uid && this.model === 'Session') {
        await cache.del(sessionUidKeyFor(payload.uid));
      }

      if (payload?.userCode) {
        await cache.del(userCodeKeyFor(payload.userCode));
      }
    }

    async consume(id: string) {
      const payload = await this.read(id);
      if (!payload) {
        return;
      }

      payload.consumed = epochTime();
      await cache.set(this.key(id), payload, getRemainingTtl(payload));
    }

    async find(id: string) {
      return normalize(await this.read(id));
    }

    async findByUid(uid: string) {
      const id = await cache.get<string>(sessionUidKeyFor(uid));
      if (!id) {
        return undefined;
      }
      return this.find(id);
    }

    async findByUserCode(userCode: string) {
      const id = await cache.get<string>(userCodeKeyFor(userCode));
      if (!id) {
        return undefined;
      }
      return this.find(id);
    }

    async upsert(id: string, payload: Record<string, any>, expiresIn: number) {
      const ttl = expiresIn * 1000;
      const stored: StoredPayload = {
        ...payload,
        __expiresAt: Date.now() + ttl,
      };

      if (this.model === 'Session' && payload.uid) {
        await cache.set(sessionUidKeyFor(payload.uid), id, ttl);
      }

      if (grantable.has(this.model) && payload.grantId) {
        const grantKey = grantKeyFor(payload.grantId);
        const grant = ((await cache.get<string[]>(grantKey)) || []).filter(Boolean);
        if (!grant.includes(this.key(id))) {
          grant.push(this.key(id));
        }
        await cache.set(grantKey, grant, ttl);
      }

      if (payload.userCode) {
        await cache.set(userCodeKeyFor(payload.userCode), id, ttl);
      }

      await cache.set(this.key(id), stored, ttl);
    }

    async revokeByGrantId(grantId: string) {
      const grantKey = grantKeyFor(grantId);
      const grant = await cache.get<string[]>(grantKey);
      if (!grant?.length) {
        return;
      }

      await Promise.all(
        grant.map((tokenKey) => {
          const id = tokenKey.slice(this.key('').length);
          return this.destroy(id);
        }),
      );
      await cache.del(grantKey);
    }
  };
}
