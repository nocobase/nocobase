/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SnowflakeIdField } from '@nocobase/database';
import { Snowflake } from '@nocobase/snowflake-id';

export class SnowflakeIdGenerator {
  private snowflake: Snowflake;

  constructor(workerId: number) {
    this.snowflake = new Snowflake({
      workerId,
    });
  }

  generate() {
    return this.snowflake.generate();
  }
}

export function setupSnowflakeIdField(workerId: number) {
  const generator = new SnowflakeIdGenerator(workerId);
  SnowflakeIdField.setSnowflakeIdGenerator(generator);
}
