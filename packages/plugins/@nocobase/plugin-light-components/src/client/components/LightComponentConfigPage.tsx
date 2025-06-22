/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Breadcrumb, theme } from 'antd';
// @ts-ignore
import { useRequest, useAPIClient } from '@nocobase/client';
// @ts-ignore
import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { useT } from '../locale';

// 定义轻量组件的数据类型
interface LightComponentData {
  key: string;
  title: string;
  description?: string;
  template?: string;
  flows?: any[];
  createdAt: string;
  updatedAt: string;
}

interface LightComponentResponse {
  data: LightComponentData;
}

export const LightComponentConfigPage: React.FC = () => {
  const { key } = useParams<{ key: string }>();
  const { token } = theme.useToken();
  const apiClient = useAPIClient();
  const flowEngine = useFlowEngine();
  const t = useT();

  // Fetch light component data
  const { data: lightComponent, loading } = useRequest<LightComponentResponse>(
    () => (key ? apiClient.resource('lightComponents').get({ filterByTk: key }) : null),
    {
      refreshDeps: [key],
    },
  );

  const configPageModel = React.useMemo(() => {
    if (!flowEngine || !lightComponent?.data) {
      return null;
    }

    return flowEngine.createModel({
      use: 'LightComConfigPageModel',
      uid: `light-component-config-page-${key}`,
      props: {
        componentKey: key,
        title: `配置 ${lightComponent.data?.title}`,
      },
    });
  }, [flowEngine, lightComponent, key]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!lightComponent?.data) {
    return <div>Light component not found</div>;
  }

  const componentTitle = lightComponent.data.title || lightComponent.data.key || 'Component';

  return (
    <div>
      <div
        style={{
          marginTop: -token.marginXXL,
          marginLeft: -token.marginLG,
          marginRight: -token.marginLG,
          padding: token.paddingLG,
          paddingTop: token.paddingMD,
          paddingBottom: token.paddingMD,
          background: token.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Breadcrumb
          items={[
            {
              title: <Link to="/admin/settings/light-components">{t('Light Components')}</Link>,
            },
            {
              title: `${t('Configure')} ${componentTitle}`,
            },
          ]}
        />
      </div>
      <div
        style={{
          marginTop: token.marginMD,
          position: 'relative',
          zIndex: 0,
        }}
      >
        {configPageModel && <FlowModelRenderer showFlowSettings hideRemoveInSettings model={configPageModel} />}
      </div>
    </div>
  );
};
