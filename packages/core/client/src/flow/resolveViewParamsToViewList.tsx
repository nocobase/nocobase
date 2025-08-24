/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { ViewParam } from './parsePathnameToViewParams';

export interface ViewItem {
  params: ViewParam;
  model: FlowModel;
}

export async function resolveViewParamsToViewList(
  flowEngine: FlowEngine,
  viewParams: ViewParam[],
  routeModel: FlowModel,
): Promise<ViewItem[]> {
  const viewItems = viewParams.map(async (params, index) => {
    let model;

    // 第一个视图是根页面
    if (index === 0) {
      model = routeModel;
    } else {
      model = flowEngine.getModel(params.viewUid) || (await flowEngine.loadModel({ uid: params.viewUid }));
    }

    if (!model) {
      throw new Error(`Model with uid ${params.viewUid} not found`);
    }
    return {
      params,
      model,
    };
  });

  return Promise.all(viewItems);
}
