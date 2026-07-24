/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModel } from '@nocobase/flow-engine';
import { tExpr } from '../../locale';
import { AIChatBoxCoreView } from './components/AIChatBoxCoreView';

export class AIChatBoxCoreModel extends FlowModel {
  render() {
    return <AIChatBoxCoreView />;
  }
}

AIChatBoxCoreModel.define({
  label: tExpr('AI chat box core'),
  hide: true,
});
