/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, observable, ViewParam } from '@nocobase/flow-engine';
import { RouteModel } from './models';

export interface ViewItem {
  params: ViewParam;
  model: FlowModel;
  hidden: {
    value: boolean;
  };
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
      hidden: observable.ref(false), // Will be calculated after all items are resolved
    };
  });

  const resolvedViewItems = await Promise.all(viewItems);

  // Calculate hidden values based on view types and positions
  let hasEmbedAfter = false;
  for (let i = resolvedViewItems.length - 1; i >= 0; i--) {
    const viewItem = resolvedViewItems[i];
    const viewType = getViewType(viewItem);

    if (viewType === 'embed' && !hasEmbedAfter) {
      hasEmbedAfter = true;
      viewItem.hidden.value = false; // embed type itself is not hidden
    } else {
      viewItem.hidden.value = hasEmbedAfter;
    }
  }

  return resolvedViewItems;
}

function getViewType(viewItem: ViewItem): string {
  if (viewItem.model instanceof RouteModel) {
    return 'embed';
  }

  const params = viewItem.model.getStepParams('popupSettings', 'openView');
  return params?.mode || 'drawer';
}
