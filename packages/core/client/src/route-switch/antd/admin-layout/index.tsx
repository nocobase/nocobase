/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { LayoutContent, useMobileLayout } from '@nocobase/client-v2';
import React from 'react';
import { AdminDynamicPage } from './AdminDynamicPage';
import { RemoteSchemaTemplateManagerPlugin } from '../../../';
import { Plugin } from '../../../application/Plugin';
import { AdminLayoutMenuItemModel } from './AdminLayoutMenuModels';
import { getAdminLayoutModel, AdminLayoutModelV1 } from './AdminLayoutModel';
import { shouldRenderIconInTitle } from './AdminLayoutMenuUtils';
import { userCenterSettings } from './userCenterSettings';

export * from './useDeleteRouteSchema';
export { AdminDynamicPage } from './AdminDynamicPage';
export { AdminLayoutMenuItemModel } from './AdminLayoutMenuModels';
export { KeepAlive, useKeepAlive } from './KeepAlive';
export { LayoutContent };
export { NocoBaseDesktopRouteType } from './route-types';
export {
  NocoBaseRouteContext,
  CurrentRouteProvider,
  useCurrentRoute,
  useAllAccessDesktopRoutes,
} from './route-runtime';
export { findFirstPageRoute, findRouteBySchemaUid } from './route-utils';
export { AdminShellProvider as AdminProvider } from './AdminShellProvider';
export { shouldRenderIconInTitle, useMobileLayout };

export const AdminLayout = (props) => {
  const flowEngine = useFlowEngine();
  const model = getAdminLayoutModel<AdminLayoutModelV1>(flowEngine, {
    create: true,
    props,
    use: AdminLayoutModelV1,
  });

  if (!model) {
    throw new Error('[NocoBase] Failed to create admin-layout-model.');
  }

  return <FlowModelRenderer model={model} />;
};

export class AdminLayoutPlugin extends Plugin {
  async afterAdd() {
    await this.app.pm.add(RemoteSchemaTemplateManagerPlugin);
  }
  async load() {
    this.app.flowEngine.registerModels({
      AdminLayoutModel: AdminLayoutModelV1,
      AdminLayoutMenuItemModel,
    });
    this.app.schemaSettingsManager.add(userCenterSettings);
    this.app.addComponents({ AdminLayout, AdminDynamicPage });
  }
}
