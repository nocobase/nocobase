/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '../../../flow-compat';
import type { AppListProps } from '@ant-design/pro-layout/es/components/AppsLogoComponents/types';
import React from 'react';
import type { AdminLayoutModel } from './AdminLayoutModel';
import { ADMIN_LAYOUT_MODEL_UID } from './constants';
import type { AppSwitcherActionPanelModel } from './AppSwitcherActionPanelModel';

export const APP_SWITCHER_ACTION_PANEL_MODEL_UID = `${ADMIN_LAYOUT_MODEL_UID}-app-switcher-actions`;

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') {
    return;
  }
  const errorLike = error as { response?: { status?: unknown }; status?: unknown };
  const status = errorLike.response?.status ?? errorLike.status;
  return typeof status === 'number' ? status : undefined;
}

export const useApplications = (adminLayoutModel?: AdminLayoutModel) => {
  const app = useApp();
  const loadAppList = app.apps.loadAppList;
  const [legacyAppList, setLegacyAppList] = React.useState<AppListProps>([]);
  const [appSwitcherModel, setAppSwitcherModel] = React.useState<AppSwitcherActionPanelModel>();

  React.useEffect(() => {
    let canceled = false;
    let modelWithLayoutContext: AppSwitcherActionPanelModel | undefined;

    if (!adminLayoutModel) {
      setAppSwitcherModel(undefined);
      return;
    }

    const load = async () => {
      try {
        const model = await adminLayoutModel.flowEngine.loadOrCreateModel<AppSwitcherActionPanelModel>({
          uid: APP_SWITCHER_ACTION_PANEL_MODEL_UID,
          use: 'AppSwitcherActionPanelModel',
          parentId: adminLayoutModel.uid,
          subKey: 'appSwitcher',
          subType: 'object',
        });
        if (canceled || !model) {
          return;
        }
        model.context.addDelegate(adminLayoutModel.context);
        modelWithLayoutContext = model;
        setAppSwitcherModel(model);
      } catch (error) {
        if (canceled) {
          return;
        }
        if (getErrorStatus(error) !== 404) {
          throw error;
        }
        setAppSwitcherModel(undefined);
      }
    };
    load();

    return () => {
      canceled = true;
      modelWithLayoutContext?.context.removeDelegate(adminLayoutModel.context);
    };
  }, [adminLayoutModel]);

  React.useEffect(() => {
    let canceled = false;

    if (adminLayoutModel) {
      setLegacyAppList([]);
      return;
    }

    if (!loadAppList) {
      setLegacyAppList([]);
      return;
    }

    const load = async () => {
      try {
        const list = await Promise.resolve(loadAppList(app));
        if (!canceled) {
          setLegacyAppList(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error('[NocoBase] Failed to load application switcher list.', error);
        if (!canceled) {
          setLegacyAppList([]);
        }
      }
    };
    load();

    return () => {
      canceled = true;
    };
  }, [adminLayoutModel, app, loadAppList]);

  const shouldRenderConfiguredSwitcher =
    !!appSwitcherModel && (appSwitcherModel.hasActions() || app.flowEngine.context.flowSettingsEnabled);

  return {
    Component: app.apps.Component,
    appList: shouldRenderConfiguredSwitcher ? [{ title: '', url: '#' }] : legacyAppList,
    appSwitcherModel,
  };
};
