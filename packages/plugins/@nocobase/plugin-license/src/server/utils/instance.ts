/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import { storagePathJoin } from '@nocobase/utils';
import { getInstanceIdAsync } from '@nocobase/license-kit';

export async function getInstanceId() {
  const filePath = storagePathJoin('.license', 'instance-id');
  await createInstanceId(true);
  const id = await fs.promises.readFile(filePath, 'utf-8');
  return id.trim();
}

export async function createInstanceId(force = false) {
  const dir = storagePathJoin('.license');
  const filePath = storagePathJoin('.license', 'instance-id');

  if (!force) {
    try {
      const existing = await fs.promises.readFile(filePath, 'utf-8');
      const normalized = existing.trim();
      if (normalized) {
        return normalized;
      }
    } catch (e) {
      // Continue to generate when the file does not exist or cannot be read.
    }
  }

  await fs.promises.mkdir(dir, { recursive: true });
  const instanceId = String(await getInstanceIdAsync()).trim();
  await fs.promises.writeFile(filePath, `${instanceId}\n`);
  return instanceId;
}

export async function isLicenseKeyExists() {
  const filePath = storagePathJoin('.license', 'license-key');
  return fs.existsSync(filePath);
}
