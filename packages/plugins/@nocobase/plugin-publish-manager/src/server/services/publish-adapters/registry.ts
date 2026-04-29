/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PublishArtifactType } from '../publish-artifact-service';
import { BackupPublishAdapter } from './backup';
import { DatabasePublishAdapter } from './database';
import { MigrationPublishAdapter } from './migration';
import { PublishAdapter } from './types';

const adapters: Record<PublishArtifactType, PublishAdapter> = {
  backup: new BackupPublishAdapter(),
  migration: new MigrationPublishAdapter(),
  database: new DatabasePublishAdapter(),
};

export function getPublishAdapter(type: PublishArtifactType) {
  const adapter = adapters[type];
  if (!adapter) {
    throw new Error(`Publish adapter ${type} is not registered`);
  }
  return adapter;
}

export function getPublishAdapterCapabilities() {
  return Object.fromEntries(Object.entries(adapters).map(([type, adapter]) => [type, adapter.capabilities()]));
}

export type { PublishAdapter, PublishAdapterCapabilities, PublishAdapterContext } from './types';
