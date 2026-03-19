/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import React, { useEffect, useRef } from 'react';
import { AdminDynamicPage, MobileLayoutProvider } from '../../../admin-shell';
import { RemoteSchemaTemplateManagerPlugin } from '../../../';
import { Plugin } from '../../../application/Plugin';
import { AdminLayoutModel } from './AdminLayoutModel';
import { AdminLayoutMenuItemModel, AdminLayoutMenuTreeModel } from './AdminLayoutMenuModels';
import { ADMIN_LAYOUT_MODEL_UID } from './constants';
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
  useMobileLayout,
  AdminShellProvider as AdminProvider,
  CurrentRouteProvider,
} from '../../../admin-shell';
export { shouldRenderIconInTitle } from './AdminLayoutMenuModels';

export const AdminLayout = (props) => {
  const flowEngine = useFlowEngine();
  const modelRef = useRef<AdminLayoutModel>(null);

  if (!modelRef.current) {
    modelRef.current =
      flowEngine.getModel<AdminLayoutModel>(ADMIN_LAYOUT_MODEL_UID) ||
      flowEngine.createModel<AdminLayoutModel>({
        uid: ADMIN_LAYOUT_MODEL_UID,
        use: AdminLayoutModel,
        props,
      });
  }

  const model = modelRef.current;

  useEffect(() => {
    model.setProps(props);
  }, [model, props]);

  return <FlowModelRenderer model={model} />;
};

export class AdminLayoutPlugin extends Plugin {
  async afterAdd() {
    await this.app.pm.add(RemoteSchemaTemplateManagerPlugin);
  }
  async load() {
    this.app.flowEngine.registerModels({
      AdminLayoutModel,
      AdminLayoutMenuTreeModel,
      AdminLayoutMenuItemModel,
    });
    this.app.schemaSettingsManager.add(userCenterSettings);
    this.app.addComponents({ AdminLayout, AdminDynamicPage });
    this.app.use(MobileLayoutProvider);
  }
}
