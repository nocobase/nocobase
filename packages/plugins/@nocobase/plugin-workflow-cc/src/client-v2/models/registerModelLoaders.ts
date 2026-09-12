/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine, ModelConstructor } from '@nocobase/flow-engine';

const registeredEngines = new WeakSet<FlowEngine>();
const registeredEngineMarker = '__workflowCcModelLoadersRegistered__';

type FlowEngineWithCcLoaderMarker = FlowEngine & {
  [registeredEngineMarker]?: boolean;
};

async function loadModel<T extends ModelConstructor>(loader: () => Promise<T>) {
  return loader();
}

export function registerWorkflowCcModelLoaders(flowEngine: FlowEngine) {
  const markedFlowEngine = flowEngine as FlowEngineWithCcLoaderMarker;
  if (
    registeredEngines.has(flowEngine) ||
    markedFlowEngine[registeredEngineMarker] ||
    typeof flowEngine.registerModelLoaders !== 'function'
  ) {
    return;
  }

  flowEngine.registerModelLoaders({
    CCChildPageModel: {
      extends: 'ChildPageModel',
      loader: () => loadModel(async () => (await import('./CCChildPageModel')).CCChildPageModel),
    },
    CCChildPageTabModel: {
      extends: 'ChildPageTabModel',
      loader: () => loadModel(async () => (await import('./CCChildPageModel')).CCChildPageTabModel),
    },
    CCBlockGridModel: {
      extends: 'BlockGridModel',
      loader: () => loadModel(async () => (await import('./CCBlockGridModel')).CCBlockGridModel),
    },
    CCTriggerBlockGridModel: {
      extends: 'BlockGridModel',
      loader: () => loadModel(async () => (await import('./CCTriggerBlockGridModel')).CCTriggerBlockGridModel),
    },
    CCTaskCardDetailsModel: {
      extends: 'DetailsBlockModel',
      loader: () => loadModel(async () => (await import('./CCTaskCardDetailsModel')).CCTaskCardDetailsModel),
    },
    CCTaskCardGridModel: {
      extends: 'DetailsGridModel',
      loader: () => loadModel(async () => (await import('./CCTaskCardGridModel')).CCTaskCardGridModel),
    },
    CCTaskCardDetailsItemModel: {
      extends: 'DetailsItemModel',
      loader: () => loadModel(async () => (await import('./CCTaskCardDetailsItemModel')).CCTaskCardDetailsItemModel),
    },
    CCTaskCardDetailsAssociationFieldGroupModel: {
      extends: 'DetailsAssociationFieldGroupModel',
      loader: () =>
        loadModel(
          async () =>
            (await import('./CCTaskCardDetailsAssociationFieldGroupModel')).CCTaskCardDetailsAssociationFieldGroupModel,
        ),
    },
  });

  registeredEngines.add(flowEngine);
  markedFlowEngine[registeredEngineMarker] = true;
}
