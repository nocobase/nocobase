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
import { ViewComponent } from './ViewComponent';

// 视图栈
const viewStack: {
  type: 'drawer' | 'modal' | 'subPage';
  ctx: FlowContext;
  model: FlowModel;
  options?: any;
}[] = observable.shallow([]);

/**
 * 视图容器组件
 * 用于渲染当前打开的视图
 */
export const ViewContainer: React.FC = observer(
  () => {
    return (
      <>
        {viewStack.map(({ type, ctx, model, options }, index) => {
          return (
            <ViewComponent key={index} type={type} ctx={ctx} options={options}>
              <FlowModelRenderer model={model} />
            </ViewComponent>
          );
        })}
      </>
    );
  },
  {
    displayName: 'ViewContainer',
  },
);

/**
 * 打开视图
 * @param params.type 打开方式，drawer、modal 或 subPage
 * @param params.ctx 上下文对象
 * @param params.model 流模型或创建模型选项
 * @param params.options 视图组件的属性
 */
export const openView = (params: {
  type: 'drawer' | 'modal' | 'subPage';
  ctx: FlowContext;
  model: FlowModel | CreateModelOptions;
  options?: any;
}) => {
  viewStack.push({
    type: params.type,
    ctx: params.ctx,
    model: params.model instanceof FlowModel ? params.model : params.ctx.model.flowEngine.createModel(params.model),
    options: params.options,
  });
};

/**
 * 关闭当前视图
 */
export const closeView = () => {
  if (viewStack.length > 0) {
    viewStack.pop();
  }
};

/**
 * 关闭所有视图
 */
export const closeAllViews = () => {
  viewStack.length = 0;
};
