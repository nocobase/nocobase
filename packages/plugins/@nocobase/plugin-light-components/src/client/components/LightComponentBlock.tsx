/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { useAPIClient } from '@nocobase/client';
import { Alert } from 'antd';

export interface LightComponentBlockProps {
  componentKey?: string;
  config?: any;
}

// Simplified component data handling
function buildSimpleProps(componentData: any): any {
  return {
    template: componentData?.template || '',
    title: componentData?.title || 'Light Component',
  };
}

export const LightComponentBlock: React.FC<LightComponentBlockProps> = ({ componentKey, config = {} }) => {
  const flowEngine = useFlowEngine();
  const apiClient = useAPIClient();
  const [lightComponent, setLightComponent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!componentKey) {
      setError('Component key is required');
      setLoading(false);
      return;
    }

    const loadLightComponent = async () => {
      try {
        setLoading(true);
        const response = await apiClient.resource('lightComponents').get({
          filterByTk: componentKey,
        });

        const componentData = response.data?.data;
        if (!componentData) {
          setError('Light component not found');
          return;
        }

        // Light component is always enabled in this simplified version

        setLightComponent(componentData);
        setError(null);
      } catch (err) {
        setError(`Failed to load light component: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadLightComponent();
  }, [componentKey, apiClient]);

  const model = React.useMemo(() => {
    if (!lightComponent || !flowEngine) {
      return null;
    }

    // Create simplified LightModel instance
    const model = flowEngine.createModel({
      use: 'LightModel',
      uid: `light-component-${componentKey}`,
      props: {
        componentKey,
        ...buildSimpleProps(lightComponent),
        ...config,
      },
    });

    return model;
  }, [lightComponent, flowEngine, componentKey, config]);

  if (loading) {
    return <div>Loading light component...</div>;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (!model) {
    return <Alert message="Error" description="Failed to create component model" type="error" showIcon />;
  }

  return <FlowModelRenderer model={model} />;
};
