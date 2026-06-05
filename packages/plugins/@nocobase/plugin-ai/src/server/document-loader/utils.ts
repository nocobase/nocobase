/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { ParseableFile } from './types';

export function resolveExtname(file: Pick<ParseableFile, 'extname' | 'filename'>): string {
  return (file.extname ?? path.extname(file.filename ?? '') ?? '').toLowerCase();
}
