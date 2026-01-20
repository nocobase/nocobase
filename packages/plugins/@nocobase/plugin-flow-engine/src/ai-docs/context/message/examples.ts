/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';

type FlowCtx = FlowModel['context'];

export async function runWithMessages(ctx: FlowCtx, task: () => Promise<void>) {
  const hide = ctx.message.loading({ content: 'Processing...' });
  try {
    await task();
    ctx.message.success({ content: 'Done' });
  } catch (error) {
    ctx.message.error({ content: (error as Error).message });
    throw error;
  } finally {
    hide?.();
  }
}
