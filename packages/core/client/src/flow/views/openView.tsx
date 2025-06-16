/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateModelOptions, FlowContext, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';
import { observable } from '@formily/reactive';
import { observer } from '@formily/react';

// 视图栈
const viewStack: { ctx: FlowContext; model: FlowModel }[] = observable.shallow([]);

export const ViewContainer: React.FC = observer(
  () => {
    return (
      <>
        {viewStack.map(({ ctx, model }, index) => {
          return <FlowModelRenderer key={index} model={model} />;
        })}
      </>
    );
  },
  {
    displayName: 'ViewContainer',
  },
);

export const openView = (params: { ctx: FlowContext; model: FlowModel | CreateModelOptions }) => {
  viewStack.push({
    ctx: params.ctx,
    model: params.model instanceof FlowModel ? params.model : params.ctx.model.flowEngine.createModel(params.model),
  });
};

export const closeView = () => {
  if (viewStack.length > 0) {
    viewStack.pop();
  }
};

export const closeAllViews = () => {
  viewStack.length = 0;
};
