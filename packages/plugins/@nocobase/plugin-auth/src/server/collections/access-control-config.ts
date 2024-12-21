/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { defineCollection } from '@nocobase/database';
import { Cache } from '@nocobase/cache';
import { secAccessCtrlConfigCollName, secAccessCtrlConfigKey, secAccessCtrlConfigCacheKey } from '../../constants';
import { SecurityAccessConfig } from '../../types';
import Application from '@nocobase/server';
export default defineCollection({
  name: secAccessCtrlConfigCollName,
  autoGenId: false,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  fields: [
    {
      name: 'key',
      type: 'string',
      primaryKey: true,
      allowNull: false,
      interface: 'input',
    },
    {
      type: 'json',
      name: 'config',
      allowNull: false,
      defaultValue: {},
    },
  ],
});

export const createAccessCtrlConfigRecord = async (db: Database) => {
  const repository = db.getRepository(secAccessCtrlConfigCollName);
  const exist = await repository.findOne({ filterByTk: secAccessCtrlConfigKey });
  if (exist) {
    return;
  }
  const config: SecurityAccessConfig = {
    tokenExpirationTime: '1h',
    maxTokenLifetime: '7d',
    renewalTokenEnabled: true,
    maxInactiveInterval: '1h',
    opTimeoutControlEnabled: true,
  };
  await repository.create({
    values: {
      key: secAccessCtrlConfigKey,
      config,
    },
  });
};

export const getAccessCtrlConfig = async (db: Database) => {
  const repository = db.getRepository(secAccessCtrlConfigCollName);

  const res = await repository.findOne({ filterByTk: secAccessCtrlConfigKey });
  return res?.data?.data?.config;
};

export const saveAccessCtrlConfigToCache = async (app: Application, db: Database, cache: Cache) => {
  try {
    const config = await getAccessCtrlConfig(db);
    if (config) {
      cache.set(secAccessCtrlConfigCacheKey, config);
    }
    db.on(`${secAccessCtrlConfigCollName}.afterUpdate`, async (model) => {
      cache.set(secAccessCtrlConfigCacheKey, model.config);
    });
  } catch (error) {
    app.logger.error('saveAccessCtrlConfigToCache error', error);
  }
};
