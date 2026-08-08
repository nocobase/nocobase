/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, Collapse, Empty } from 'antd';
import React, { useEffect, useState } from 'react';
import { FlowModel } from '../../../../models';
import {
  createFlowWithSettingSteps,
  getFlowSettingSteps,
  resolveStepUiSchema,
  shouldHideStepInSettings,
} from '../../../../utils';
import { FlowSettings } from './FlowSettings';
import { FlowDefinition } from '../../../../FlowDefinition';
import { observer } from '../../../../reactive';

const { Panel } = Collapse;

// 提取核心渲染逻辑到一个共享组件
interface FlowsSettingsContentProps {
  model: FlowModel;
  expandAll?: boolean;
}

// 默认使用 Collapse 组件渲染多个流程设置
const FlowsSettingsContent: React.FC<FlowsSettingsContentProps> = observer(({ model, expandAll = false }) => {
  const [filterFlows, setFilterFlows] = useState<FlowDefinition[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshTick((value) => value + 1);
    model.emitter?.on('onStepParamsChanged', refresh);
    return () => model.emitter?.off('onStepParamsChanged', refresh);
  }, [model]);

  useEffect(() => {
    let mounted = true;
    const buildFilterFlows = async () => {
      const flows = model.getFlows();
      const result: FlowDefinition[] = [];
      for (const flow of Array.from(flows.values())) {
        const flowSteps = await getFlowSettingSteps(model, flow, flow.key);
        const flowForSettings = createFlowWithSettingSteps(flow, flowSteps, flow.key);
        const configurableSteps = await Promise.all(
          Object.entries(flowSteps).map(async ([stepKey, actionStep]) => {
            // 如果步骤设置了 hideInSettings: true 或动态隐藏，则跳过此步骤
            if (await shouldHideStepInSettings(model, flowForSettings, actionStep)) {
              return null;
            }
            const mergedUiSchema = await resolveStepUiSchema(model, flowForSettings, actionStep);

            // 如果没有可配置的UI Schema，返回null
            if (!mergedUiSchema || Object.keys(mergedUiSchema).length === 0) {
              return null;
            }

            return { stepKey, step: actionStep, uiSchema: mergedUiSchema };
          }),
        ).then((steps) => steps.filter(Boolean));

        if (configurableSteps.length > 0) {
          result.push(flowForSettings as FlowDefinition);
        }
      }

      if (mounted) {
        setFilterFlows(result);
      }
    };

    buildFilterFlows();
    return () => {
      mounted = false;
    };
  }, [model, refreshTick]);

  const flowKeys = filterFlows.map((flow) => flow.key);
  if (flowKeys.length === 0) {
    return <Empty description="没有可用的流程" />;
  }

  // 如果expandAll为true，则默认展开所有面板
  const defaultActiveKey = expandAll ? flowKeys : undefined;

  return (
    <Card title="Flows设置">
      <Collapse defaultActiveKey={defaultActiveKey}>
        {flowKeys.map((flowKey) => (
          <Panel header={filterFlows.find((flow) => flow.key === flowKey)?.title || flowKey} key={flowKey}>
            <FlowSettings model={model} flowKey={flowKey} />
          </Panel>
        ))}
      </Collapse>
    </Card>
  );
});

export default FlowsSettingsContent;
