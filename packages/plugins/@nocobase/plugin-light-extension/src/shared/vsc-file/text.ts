/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { VscError } from './errors';

const utf8Bom = '\ufeff';

export function normalizeText(content: string): string {
  if (typeof content !== 'string') {
    throw new VscError('TEXT_ENCODING_INVALID', 'Text content must be a string');
  }

  const withoutBom = content.startsWith(utf8Bom) ? content.slice(1) : content;
  const normalized = withoutBom.replace(/\r\n?/g, '\n');

  if (normalized.includes('\0')) {
    throw new VscError('TEXT_ENCODING_INVALID', 'Text content must not contain NUL');
  }

  return normalized;
}
