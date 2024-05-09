/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stat } from 'fs/promises';

export async function fsExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    return false;
  }
}
