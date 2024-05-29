/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import match from 'mime-match';

export default function (file, options: string | string[] = '*'): boolean {
  const pattern = options.toString().trim();
  if (!pattern || pattern === '*') {
    return true;
  }
  return pattern.split(',').some(match(file.mimetype));
}
