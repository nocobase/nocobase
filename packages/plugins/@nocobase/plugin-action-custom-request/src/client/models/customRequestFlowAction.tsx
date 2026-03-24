/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr } from '@nocobase/flow-engine';
import { getCustomRequestConfigActionDefinition } from './common/customRequestDefinition';
import { executeCustomRequest } from './common/customRequest.shared';
import { CustomRequestStepParams } from './customRequestFlowActionTypes';

export const customRequestFlowAction = defineAction({
  name: 'customRequest',
  title: tExpr('Custom request'),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  sort: 700,
  ...getCustomRequestConfigActionDefinition(),
  handler: async (ctx, params: CustomRequestStepParams) => {
    return executeCustomRequest(ctx, params);
  },
});
