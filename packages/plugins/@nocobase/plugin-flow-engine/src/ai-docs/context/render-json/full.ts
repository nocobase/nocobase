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

export async function resolveObject(ctx: FlowCtx) {
  const template = {
    str: '{{ctx.current.key1}}',
    num: '{{ctx.current.key3}}',
    nested: {
      ref: '{{ctx.current.key4}}',
    },
  };
  return ctx.resolveJsonTemplate(template);
}
