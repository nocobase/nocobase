/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelRenderer, useFlowEngine, useFlowModelById, useFlowViewContext } from '@nocobase/flow-engine';
import type { FlowModel } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React, { useEffect, useRef } from 'react';
import {
  AdminLayoutModel,
  useAllAccessDesktopRoutes,
  useCurrentRoute,
  useKeepAlive,
  useMobileLayout,
} from '../route-switch';
import { SkeletonFallback } from './components/SkeletonFallback';
import { useDesignable } from '../schema-component';
import { deviceType } from 'react-device-detect';

function InternalFlowPage({ uid, ...props }) {
  const model = useFlowModelById(uid);
  return (
    <FlowModelRenderer
      model={model}
      fallback={
        <SkeletonFallback
          style={{ margin: model?.context.isMobileLayout ? 8 : model?.context.themeToken.marginBlock }}
        />
      }
      hideRemoveInSettings
      showFlowSettings={{ showBackground: false, showBorder: false }}
      {...props}
    />
  );
}

export const FlowRoute = () => {
  const flowEngine = useFlowEngine();
  const route = flowEngine.context.route || {};
  const currentRoute = useCurrentRoute();
  const { refresh } = useAllAccessDesktopRoutes();
  const { isMobileLayout } = useMobileLayout();
  const pageUidRef = useRef(route?.params?.name);
  const { designable } = useDesignable();
  const { active } = useKeepAlive();
  const pageUid = pageUidRef.current;
  const adminLayoutModel = flowEngine.getModel<AdminLayoutModel>('admin-layout-model');
  const activeRef = useRef(active);
  const currentRouteRef = useRef(currentRoute);
  const refreshRef = useRef(refresh);

  activeRef.current = active;
  currentRouteRef.current = currentRoute;
  refreshRef.current = refresh;

  if (!adminLayoutModel) {
    throw new Error('[NocoBase] FlowRoute requires admin-layout-model. Please render FlowRoute under AdminLayout.');
  }

  if (!pageUid) {
    throw new Error('[NocoBase] FlowRoute requires route.params.name.');
  }

  useEffect(() => {
    flowEngine.context.defineProperty('isMobileLayout', {
      get: () => isMobileLayout,
      info: {
        description: 'Whether current layout is mobile layout.',
        detail: 'boolean',
      },
    });
    flowEngine.context.defineProperty('deviceType', {
      get: () => (deviceType === 'browser' ? 'computer' : deviceType),
      cache: false,
      meta: {
        type: 'string',
        title: flowEngine.translate('Current device type'),
        interface: 'select',
        uiSchema: {
          enum: [
            { label: flowEngine.translate('Computer'), value: 'computer' },
            { label: flowEngine.translate('Mobile'), value: 'mobile' },
            { label: flowEngine.translate('Tablet'), value: 'tablet' },
            { label: flowEngine.translate('SmartTv'), value: 'smarttv' },
            { label: flowEngine.translate('Console'), value: 'console' },
            { label: flowEngine.translate('Wearable'), value: 'wearable' },
            { label: flowEngine.translate('Embedded'), value: 'embedded' },
          ],
          'x-component': 'Select',
        },
      },
      info: {
        description: 'Current device type (computer/mobile/tablet/...).',
        detail: 'string',
      },
    });
  }, [isMobileLayout, flowEngine]);

  useEffect(() => {
    // 移动端中不允许配置 UI
    if (isMobileLayout) {
      flowEngine.flowSettings.disable();
    } else if (designable) {
      flowEngine.flowSettings.enable();
    }
  }, [designable, flowEngine, isMobileLayout]);

  useEffect(() => {
    adminLayoutModel.registerRoutePage(pageUid, {
      active: activeRef.current,
      currentRoute: currentRouteRef.current,
      refreshDesktopRoutes: refreshRef.current,
    });
    return () => {
      adminLayoutModel.unregisterRoutePage(pageUid);
    };
  }, [adminLayoutModel, pageUid]);

  useEffect(() => {
    adminLayoutModel.updateRoutePage(pageUid, {
      active,
    });
  }, [adminLayoutModel, pageUid, active]);

  useEffect(() => {
    adminLayoutModel.updateRoutePage(pageUid, {
      currentRoute,
      refreshDesktopRoutes: refresh,
    });
  }, [adminLayoutModel, pageUid, currentRoute, refresh]);

  return null;
};

type FlowPageProps = {
  pageModelClass?: string;
  parentId?: string;
  onModelLoaded?: (uid: string, model: FlowModel) => void;
  defaultTabTitle?: string;
};

export const FlowPage = React.memo((props: FlowPageProps & Record<string, unknown>) => {
  const { pageModelClass = 'ChildPageModel', parentId, onModelLoaded, defaultTabTitle, ...rest } = props;
  const flowEngine = useFlowEngine();
  const ctx = useFlowViewContext();
  const { loading, data } = useRequest(
    async () => {
      const options = {
        async: true,
        parentId,
        subKey: 'page',
        subType: 'object',
        use: pageModelClass,
      };
      if (pageModelClass === 'ChildPageModel') {
        const tabTitle = defaultTabTitle || flowEngine.translate?.('Details');
        options['subModels'] = {
          tabs: [
            {
              use: 'ChildPageTabModel',
              stepParams: {
                pageTabSettings: {
                  tab: {
                    title: tabTitle,
                  },
                },
              },
            },
          ],
        };
        // 弹窗或者子页面中，默认显示 tab
        options['stepParams'] = {
          pageSettings: {
            general: {
              displayTitle: false,
              enableTabs: true,
            },
          },
        };
      }
      const data = await flowEngine.loadOrCreateModel(options);
      if (data?.uid && onModelLoaded) {
        data.context.addDelegate(ctx);
        data.removeParentDelegate();
        onModelLoaded(data.uid, data);
      }
      return data;
    },
    {
      refreshDeps: [parentId],
    },
  );
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: ctx?.isMobileLayout ? 8 : ctx?.themeToken.marginBlock }} />;
  }
  return <InternalFlowPage uid={data.uid} {...rest} />;
});

FlowPage.displayName = 'FlowPage';

export const RemoteFlowModelRenderer = (props) => {
  const { uid, parentId, subKey, ...rest } = props;
  const flowEngine = useFlowEngine();
  const { loading, data } = useRequest(
    async () => {
      const data = await flowEngine.loadModel({ uid, parentId, subKey });
      return data;
    },
    {
      refreshDeps: [uid, parentId, subKey],
    },
  );
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <InternalFlowPage uid={data.uid} {...rest} />;
};
