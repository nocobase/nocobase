/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  decodeUIOperation as decode,
  encodeUIOperation as encode,
  parseUIOperation as parse,
  removeUIOperation,
  UI_OPERATION_QUERY_KEY,
  type UIOperation,
} from '@nocobase/shared';
import { browserUIOperationCodec } from './ui-operation-codec';

export function parseUIOperation(search: string): UIOperation | undefined {
  return parse(search, browserUIOperationCodec);
}

export function decodeUIOperation(encoded: string): UIOperation | undefined {
  return decode(encoded, browserUIOperationCodec);
}

export function encodeUIOperation(operation: UIOperation): string {
  return encode(operation, browserUIOperationCodec);
}

export { browserUIOperationCodec, removeUIOperation, UI_OPERATION_QUERY_KEY };
export type { UIOperation };
