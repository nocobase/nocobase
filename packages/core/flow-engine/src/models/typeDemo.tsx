/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext } from '../types';
import { defineAction } from '../utils';
import { FlowModel } from './flowModel';

class TypeDemoModel extends FlowModel<FlowContext<TypeDemoModel, { abc: string }, { def: string }, { ghi: string }>> {
  injectedValue: {
    abc: string;
  };

  render() {
    return null;
  }
}

const demoAction = defineAction<FlowContext<TypeDemoModel, { abc: string }, { def: string }, { ghi: string }>>({
  name: 'demoAction',
  title: 'Demo Action',
  uiSchema: {},
  handler(ctx, params) {},
});

TypeDemoModel.registerFlow({
  key: 'typeDemo',
  title: 'Type Demo',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      handler(ctx) {},
    },
  },
});
