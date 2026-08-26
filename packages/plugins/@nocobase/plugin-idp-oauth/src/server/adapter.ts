/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '@nocobase/server';
import { createDbAdapter } from './db-adapter';
import type { IdpOauthService } from './service';
import type { AdapterConstructor } from 'oidc-provider';

export function createOidcAdapter(
  app: Application,
  service: IdpOauthService,
  collectionName = 'oidcStates',
): AdapterConstructor {
  const DbAdapter = createDbAdapter(app, collectionName);

  return class OidcAdapter {
    private readonly dbAdapter: any;

    constructor(private readonly model: string) {
      this.dbAdapter = new DbAdapter(model);
    }

    async find(id: string) {
      if (this.model === 'Client') {
        const resolvedClient = await service.resolveClient(id);
        if (resolvedClient) {
          return resolvedClient;
        }
      }

      return this.dbAdapter.find(id);
    }

    async findByUserCode(userCode: string) {
      return this.dbAdapter.findByUserCode(userCode);
    }

    async findByUid(uid: string) {
      return this.dbAdapter.findByUid(uid);
    }

    async upsert(id: string, payload: Record<string, any>, expiresIn?: number) {
      return this.dbAdapter.upsert(id, payload, expiresIn);
    }

    async consume(id: string) {
      return this.dbAdapter.consume(id);
    }

    async destroy(id: string) {
      return this.dbAdapter.destroy(id);
    }

    async revokeByGrantId(grantId: string) {
      return this.dbAdapter.revokeByGrantId(grantId);
    }
  };
}
