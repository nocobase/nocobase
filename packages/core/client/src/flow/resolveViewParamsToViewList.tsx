/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, observable, ViewParam } from '@nocobase/flow-engine';
import { RouteModel } from './models/base/RouteModel';

export interface ViewItem {
  params: ViewParam;
  modelUid: string;
  model?: FlowModel;
  hidden: {
    value: boolean;
  };
  index: number;
}

export function resolveViewParamsToViewList(
  flowEngine: FlowEngine,
  viewParams: ViewParam[],
  routeModel: FlowModel,
): ViewItem[] {
  const viewItems = viewParams.map((params, index) => {
    let model;
    let modelUid = params.viewUid;

    // 第一个视图是根页面
    if (index === 0) {
      model = routeModel;
      modelUid = routeModel.uid;
    } else {
      model = flowEngine.getModel(params.viewUid, true);
    }

    return {
      params,
      modelUid,
      model,
      hidden: observable.ref(false), // Will be calculated after all items are resolved
      index,
    };
  });

  return viewItems;
}

export function updateViewListHidden(viewItems: ViewItem[]) {
  // Calculate hidden values based on view types and positions
  let hasEmbedAfter = false;
  for (let i = viewItems.length - 1; i >= 0; i--) {
    const viewItem = viewItems[i];
    const viewType = getViewType(viewItem);

    if (viewType === 'embed' && !hasEmbedAfter) {
      hasEmbedAfter = true;
      viewItem.hidden.value = false; // embed type itself is not hidden
    } else {
      viewItem.hidden.value = hasEmbedAfter;
    }
  }
}

function getViewType(viewItem: ViewItem): string {
  if (viewItem.model instanceof RouteModel) {
    return 'embed';
  }

  if (!viewItem.model) {
    return 'drawer';
  }

  const params = viewItem.model.getStepParams('popupSettings', 'openView');
  return params?.mode || 'drawer';
}
