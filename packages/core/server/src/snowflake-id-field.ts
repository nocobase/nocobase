/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SnowflakeIdField as BaseSnowflakeIdField } from '@nocobase/database';
import Application from './application';

export function setupSnowflakeIdField(app: Application) {
  class SnowflakeIdField extends BaseSnowflakeIdField {}
  SnowflakeIdField.setApp(app);
  app.db.registerFieldTypes({
    snowflakeId: SnowflakeIdField,
  });
}
