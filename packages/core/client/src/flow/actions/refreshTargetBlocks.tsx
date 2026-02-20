/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ActionScene, defineAction, tExpr, useFlowContext } from '@nocobase/flow-engine';
import { Space, Input, Button } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export const refreshTargetBlocks = defineAction({
  name: 'refreshTargetBlocks',
  title: tExpr('Refresh target blocks'),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  sort: 300,
  uiSchema: {
    targets: {
      type: 'array',
      'x-component': EditTargets,
      'x-component-props': {},
    },
  },
  async handler(ctx, params) {
    const { targets = [] } = params;
    targets.forEach((target) => {
      const modelInstance = ctx.engine.getModel(target, true);
      if (!modelInstance) {
        console.warn(`Not found model: ${target}`);
        return;
      }
      modelInstance.refresh();
    });
  },
});

function EditTargets(props: Readonly<{ value?: string[]; onChange?: (value: string[]) => void }>) {
  const { value = [], onChange } = props;
  const { t } = useTranslation();
  const ctx = useFlowContext();
  const token = ctx.themeToken;

  // 确保至少有一个输入框
  const targets = value.length > 0 ? value : [''];

  const handleChange = (index: number, newValue: string) => {
    const newTargets = [...targets];
    newTargets[index] = newValue;
    onChange?.(newTargets);
  };

  const handleRemove = (index: number) => {
    const newTargets = targets.filter((_, i) => i !== index);
    onChange?.(newTargets.length > 0 ? newTargets : ['']);
  };

  const handleAdd = () => {
    onChange?.([...targets, '']);
  };

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {targets.map((target, index) => (
        <Space key={`target-${index}-${target}`} style={{ width: '100%' }} size={8}>
          <Input
            placeholder={t('Target block uid')}
            value={target}
            onChange={(e) => handleChange(index, e.target.value)}
            style={{ flex: 1 }}
          />
          {targets.length > 1 && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => handleRemove(index)}
              aria-label={t('Remove')}
              style={{ color: token.colorTextSecondary }}
            />
          )}
        </Space>
      ))}
      <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAdd}>
        {t('Add target block')}
      </Button>
    </Space>
  );
}
