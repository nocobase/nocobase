/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import { commonConditionHandler, ConditionBuilder } from '../components/ConditionBuilder';

export const beforeAction = {
  title: tExpr('Before action'),
  name: 'beforeAction',
  uiSchema: {
    condition: {
      type: 'object',
      title: tExpr('Trigger condition'),
      'x-decorator': 'FormItem',
      'x-component': ConditionBuilder,
    },
  },
  handler: commonConditionHandler,
};
