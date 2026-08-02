/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowModelRenderer,
  isInheritedFrom,
  useFlowEngine,
  useFlowModelById,
  useFlowViewContext,
} from '@nocobase/flow-engine';
import type { FlowEngineContext, FlowModel, FlowModelRendererProps, ModelConstructor } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React from 'react';
import FlowRoute from './components/FlowRoute';
import { SkeletonFallback } from './components/SkeletonFallback';
import { ChildPageModel } from './models';

const defaultPageFlowSettings: FlowModelRendererProps['showFlowSettings'] = {
  showBackground: false,
  showBorder: false,
};

function InternalFlowPage({
  uid,
  showFlowSettings,
  ...props
}: { uid: string; showFlowSettings?: FlowModelRendererProps['showFlowSettings'] } & Record<string, unknown>) {
  const model = useFlowModelById(uid);
  const resolvedShowFlowSettings = showFlowSettings ?? model?.props?.showFlowSettings ?? defaultPageFlowSettings;

  return (
    <FlowModelRenderer
      model={model}
      fallback={
        <SkeletonFallback
          style={{ margin: model?.context.isMobileLayout ? 8 : model?.context.themeToken.marginBlock }}
        />
      }
      hideRemoveInSettings
      showFlowSettings={resolvedShowFlowSettings}
      {...props}
    />
  );
}

type FlowPageProps = {
  pageModelClass?: string;
  parentId?: string;
  onModelLoaded?: (uid: string, model: FlowModel) => void;
  defaultTabTitle?: string;
  showFlowSettings?: FlowModelRendererProps['showFlowSettings'];
};

type FlowPageViewContext = FlowEngineContext & {
  view?: {
    inputArgs?: {
      filterByTk?: unknown;
      isMobileLayout?: unknown;
      sourceId?: unknown;
    };
  };
};

const bindViewLayoutState = (model: FlowModel, ctx?: FlowPageViewContext | null) => {
  const hasViewMobileLayout = typeof ctx?.view?.inputArgs?.isMobileLayout === 'boolean';
  const hasContextMobileLayout = typeof ctx?.isMobileLayout === 'boolean';
  if (!hasViewMobileLayout && !hasContextMobileLayout) {
    return;
  }

  model.context.defineProperty('isMobileLayout', {
    get: () => {
      if (typeof ctx?.isMobileLayout === 'boolean') {
        return ctx.isMobileLayout;
      }
      return !!ctx?.view?.inputArgs?.isMobileLayout;
    },
    cache: false,
  });
};

export const FlowPage = React.memo((props: FlowPageProps & Record<string, unknown>) => {
  const { pageModelClass = 'ChildPageModel', parentId, onModelLoaded, defaultTabTitle, ...rest } = props;
  const flowEngine = useFlowEngine();
  const ctx = useFlowViewContext<FlowPageViewContext>();
  const { loading, data, error } = useRequest(
    async () => {
      const ModelClass = await flowEngine.getModelClassAsync(pageModelClass);
      if (!ModelClass) {
        throw new Error(`[NocoBase] Page model class '${pageModelClass}' is not registered.`);
      }
      const shouldInjectDefaultChildTab =
        ModelClass === ChildPageModel || isInheritedFrom(ModelClass as ModelConstructor, ChildPageModel);
      const options = {
        async: true,
        parentId,
        subKey: 'page',
        subType: 'object',
        use: pageModelClass,
      };
      const isRuntimeRecordScopedPage =
        !flowEngine.context.flowSettingsEnabled &&
        (typeof ctx?.view?.inputArgs?.filterByTk !== 'undefined' ||
          typeof ctx?.view?.inputArgs?.sourceId !== 'undefined');
      if (shouldInjectDefaultChildTab) {
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
      const data =
        (isRuntimeRecordScopedPage && (await flowEngine.loadModel({ ...options, refresh: true }))) ||
        (await flowEngine.loadOrCreateModel(options, { skipSave: !flowEngine.context.flowSettingsEnabled }));
      if (data?.uid && onModelLoaded) {
        data.context.addDelegate(ctx);
        bindViewLayoutState(data, ctx);
        data.removeParentDelegate();
        onModelLoaded(data.uid, data);
      }
      return data;
    },
    {
      refreshDeps: [parentId, pageModelClass, defaultTabTitle],
    },
  );
  if (error) {
    throw error;
  }
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

export { FlowRoute };
