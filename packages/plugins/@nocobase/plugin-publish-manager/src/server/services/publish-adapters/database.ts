/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PublishAdapter, PublishAdapterCapabilities } from './types';

export class DatabasePublishAdapter implements PublishAdapter {
  type = 'database' as const;

  capabilities(): PublishAdapterCapabilities {
    return {
      generate: false,
      upload: false,
      execute: false,
      unavailableReason: 'Database publish adapter is reserved for a later version',
    };
  }

  async generate(): Promise<any> {
    throw new Error('Database publish adapter is not available');
  }

  async validateUpload(): Promise<any> {
    throw new Error('Database publish adapter is not available');
  }

  async execute(): Promise<any> {
    throw new Error('Database publish adapter is not available');
  }
}
