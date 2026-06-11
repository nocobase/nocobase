/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { getPluginT } from '../client-v2/locale';
import { registerMenuExtensions } from '../client-v2/menuExtensions';
import { registerOpenViewPopupTemplateAction } from '../client-v2/openViewActionExtensions';

export const blockTemplatesPageLoader = () => import('../client-v2/pages/BlockTemplatesPage');

export const popupTemplatesPageLoader = () => import('../client-v2/pages/PopupTemplatesPage');

export function registerLegacyUiTemplateModelLoaders(flowEngine: FlowEngine) {
  flowEngine.registerModelLoaders({
    ReferenceBlockModel: {
      loader: () => import('../client-v2/models/ReferenceBlockModel'),
    },
    ReferenceFormGridModel: {
      loader: () => import('../client-v2/models/ReferenceFormGridModel'),
    },
    SubModelTemplateImporterModel: {
      loader: () => import('../client-v2/models/SubModelTemplateImporterModel'),
    },
  });
}

export function registerLegacyUiTemplateExtensions(flowEngine: FlowEngine) {
  registerOpenViewPopupTemplateAction(flowEngine);
  registerMenuExtensions();
  flowEngine.flowSettings.registerDynamicFlowSourceProvider({
    key: 'ui-templates-reference-block',
    visible(model) {
      if (!isReferenceBlockModel(model)) {
        return false;
      }
      const target = model.context?.refModel as FlowModel | undefined;
      return !!target && target.getEvents().size > 0;
    },
    getSources(model) {
      if (!isReferenceBlockModel(model)) {
        return [];
      }

      const target = model.context?.refModel as FlowModel | undefined;
      if (!target || target.uid === model.uid || target.getEvents().size === 0) {
        return [];
      }

      return [
        {
          key: 'referenced-template',
          label: getPluginT(model)('Referenced template'),
          model: target,
          sort: 10,
        },
      ];
    },
  });
}

function isReferenceBlockModel(model: FlowModel): boolean {
  return model?.use === 'ReferenceBlockModel' || model?.constructor?.name === 'ReferenceBlockModel';
}
