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
import React from 'react';
import FlowRoute from './components/FlowRoute';
import { SkeletonFallback } from './components/SkeletonFallback';

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
      const data = await flowEngine.loadOrCreateModel(options, { skipSave: !flowEngine.context.flowSettingsEnabled });
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

export { FlowRoute };
