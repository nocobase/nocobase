/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowEngine } from '@nocobase/flow-engine';
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
}
