/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SnowflakeIdField } from '@nocobase/database';
import { Snowflake } from 'nodejs-snowflake';

export class SnowflakeIdGenerator {
  private snowflake: Snowflake;
  // 2020-11-11 00:00:00 The date of the first commit of NocoBase.
  private epoch = 1605024000000;

  constructor(workerId: number) {
    this.snowflake = new Snowflake({
      instance_id: workerId,
      custom_epoch: this.epoch,
    });
  }

  getUniqueID() {
    return this.snowflake.getUniqueID();
  }
}

export function setupSnowflakeIdField(workerId: number) {
  const generator = new SnowflakeIdGenerator(workerId);
  SnowflakeIdField.setSnowflakeIdGenerator(generator);
}
