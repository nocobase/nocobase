/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import React from 'react';
import { AdminDynamicPage } from '../../../admin-shell';
import { RemoteSchemaTemplateManagerPlugin } from '../../../';
import { Plugin } from '../../../application/Plugin';
import { AdminLayoutMenuItemModel, getAdminLayoutModel } from '../../../flow/admin-shell/admin-layout';
import { AdminLayoutModelV1 } from './AdminLayoutModel';
import { userCenterSettings } from './userCenterSettings';

export * from './useDeleteRouteSchema';
export {
  AdminDynamicPage,
  KeepAlive,
  LayoutContent,
  NocoBaseDesktopRouteType,
  NocoBaseRouteContext,
  findFirstPageRoute,
  findRouteBySchemaUid,
  useAllAccessDesktopRoutes,
  useCurrentRoute,
  useKeepAlive,
  AdminShellProvider as AdminProvider,
  CurrentRouteProvider,
} from '../../../admin-shell';
export { shouldRenderIconInTitle, useMobileLayout } from '../../../flow/admin-shell/admin-layout';

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
