/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '../../../flow-compat';
import React from 'react';
import type { AdminLayoutModel } from './AdminLayoutModel';
import { ADMIN_LAYOUT_MODEL_UID } from './constants';
import type { AppSwitcherActionPanelModel } from './AppSwitcherActionPanelModel';

export const APP_SWITCHER_ACTION_PANEL_MODEL_UID = `${ADMIN_LAYOUT_MODEL_UID}-app-switcher-actions`;

export const useApplications = (adminLayoutModel?: AdminLayoutModel) => {
  const app = useApp();
  const loadAppList = app.apps.loadAppList;
  const [appList, setAppList] = React.useState([]);
  const [appSwitcherModel, setAppSwitcherModel] = React.useState<AppSwitcherActionPanelModel>();

  React.useEffect(() => {
    let canceled = false;

    if (!loadAppList) {
      setAppList([]);
      return;
    }

    const load = async () => {
      try {
        const list = await Promise.resolve(loadAppList(app));
        if (!canceled) {
          setAppList(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error('[NocoBase] Failed to load application switcher list.', error);
        if (!canceled) {
          setAppList([]);
        }
      }
    };
    load();

    return () => {
      canceled = true;
    };
  }, [app, loadAppList]);

  React.useEffect(() => {
    let canceled = false;

    if (!adminLayoutModel) {
      setAppSwitcherModel(undefined);
      return;
    }

    const load = async () => {
      const model = await adminLayoutModel.flowEngine.loadOrCreateModel<AppSwitcherActionPanelModel>({
        uid: APP_SWITCHER_ACTION_PANEL_MODEL_UID,
        use: 'AppSwitcherActionPanelModel',
        parentId: adminLayoutModel.uid,
        subKey: 'appSwitcher',
        subType: 'object',
      });
      if (!canceled) {
        setAppSwitcherModel(model);
      }
    };
    load();

    return () => {
      canceled = true;
    };
  }, [adminLayoutModel]);

  const shouldRenderConfiguredSwitcher =
    !!appSwitcherModel && (appSwitcherModel.hasActions() || app.flowEngine.context.flowSettingsEnabled);

  return {
    Component: app.apps.Component,
    appList: shouldRenderConfiguredSwitcher ? [{ title: '', url: '#' }] : appList,
    appSwitcherModel,
  };
};
