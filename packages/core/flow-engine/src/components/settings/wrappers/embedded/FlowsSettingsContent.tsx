/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Card, Empty, Collapse } from 'antd';
import { StepDefinition } from '../../../../types';
import { FlowModel } from '../../../../models';
import { observer } from '@formily/react';
import { FlowSettings } from './FlowSettings';

const { Panel } = Collapse;

// 提取核心渲染逻辑到一个共享组件
interface FlowsSettingsContentProps {
  model: FlowModel;
  expandAll?: boolean;
}

// 默认使用 Collapse 组件渲染多个流程设置
const FlowsSettingsContent: React.FC<FlowsSettingsContentProps> = observer(({ model, expandAll = false }) => {
  const ModelClass = model.constructor as typeof FlowModel;
  const flows = ModelClass.getFlows();

  const filterFlows = Array.from(flows.values()).filter((flow) => {
    const configurableSteps = Object.entries(flow.steps)
      .map(([stepKey, actionStep]) => {
        // 如果步骤设置了 hideInSettings: true，则跳过此步骤
        if (actionStep.hideInSettings) {
          return null;
        }

        // 从step获取uiSchema（如果存在）
        const stepUiSchema = actionStep.uiSchema || {};

        // 如果step使用了action，也获取action的uiSchema
        let actionUiSchema = {};
        if (actionStep.use) {
          const action = model.flowEngine?.getAction?.(actionStep.use);
          if (action && action.uiSchema) {
            actionUiSchema = action.uiSchema;
          }
        }

        // 合并uiSchema，确保step的uiSchema优先级更高
        // 先复制action的uiSchema，然后用step的uiSchema覆盖相同的字段
        const mergedUiSchema = { ...actionUiSchema };

        // 将stepUiSchema中的字段合并到mergedUiSchema
        Object.entries(stepUiSchema).forEach(([fieldKey, schema]) => {
          if (mergedUiSchema[fieldKey]) {
            // 如果字段已存在，则合并schema对象，保持step中的属性优先级更高
            mergedUiSchema[fieldKey] = { ...mergedUiSchema[fieldKey], ...schema };
          } else {
            // 如果字段不存在，则直接添加
            mergedUiSchema[fieldKey] = schema;
          }
        });

        // 如果没有可配置的UI Schema，返回null
        if (Object.keys(mergedUiSchema).length === 0) {
          return null;
        }

        return { stepKey, step: actionStep, uiSchema: mergedUiSchema };
      })
      .filter(Boolean);
    return configurableSteps.length > 0;
  });

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
          <Panel header={flows.get(flowKey)?.title || flowKey} key={flowKey}>
            <FlowSettings model={model} flowKey={flowKey} />
          </Panel>
        ))}
      </Collapse>
    </Card>
  );
});

export default FlowsSettingsContent;
