/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Snowflake as SnowflakeId } from 'nodejs-snowflake';
import os from 'os';

class Snowflake {
  snowflake: SnowflakeId;

  constructor(epoch?: number) {
    const interfaces = os.networkInterfaces();
    let instanceId: number;
    let hasFound = false;

    for (const name of Object.keys(interfaces)) {
      if (!/^(eth|en|wl)/.test(name)) {
        continue;
      }
      const addresses = interfaces[name];
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          try {
            const parts = addr.address.split('.').map((part) => parseInt(part, 10));
            if (parts.length !== 4 || parts.some((p) => p < 0 || p > 255)) {
              continue;
            }
            const ipNum = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
            instanceId = ipNum % 100;
            hasFound = true;
          } catch (err) {
            continue;
          }
        }

        if (instanceId) {
          break;
        }
      }
    }

    this.snowflake = new SnowflakeId({
      instance_id: instanceId,
      custom_epoch: epoch,
    });
  }

  generate() {
    return this.snowflake.getUniqueID();
  }
}

export default Snowflake;
