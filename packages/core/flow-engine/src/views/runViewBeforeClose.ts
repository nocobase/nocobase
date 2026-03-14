/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowView, FlowViewBeforeClosePayload } from './FlowView';

export async function runViewBeforeClose(view: FlowView, payload: FlowViewBeforeClosePayload): Promise<boolean> {
  if (payload.force) {
    return true;
  }

  const result = await view.beforeClose?.(payload);
  return result !== false;
}
