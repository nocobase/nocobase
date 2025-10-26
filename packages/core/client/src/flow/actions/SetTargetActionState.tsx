/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, escapeT, useFlowContext } from '@nocobase/flow-engine';
import { Select, Input, Radio } from 'antd';
import type { RadioChangeEvent } from 'antd/es/radio';
import React from 'react';
import { evaluateConditions, FilterGroupType } from '@nocobase/utils/client';
import { ConditionBuilder } from '../components/ConditionBuilder';
import { ActionModel } from '../models/base/ActionModel';

type ActionState = 'visible' | 'hidden' | 'hiddenText' | 'enabled' | 'disabled';

type ActionStateValue = {
  targetScope: 'current' | 'other';
  targetActionUid?: string;
  stateMode?: 'conditional' | 'direct';
  condition?: FilterGroupType;
  state?: ActionState;
  stateWhenMet?: ActionState;
  stateWhenNotMet?: ActionState;
};

export const SetTargetActionState = defineAction({
  name: 'SetTargetActionState',
  title: escapeT('Set target action state'),
  scene: ActionScene.DYNAMIC_EVENT_FLOW,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value: rawValue = {}, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const isActionModel = ctx.model instanceof ActionModel;
        const currentActionUid = ctx.model.uid;
        const stateMode = rawValue.stateMode ?? 'direct';
        const targetScope = rawValue.targetScope || (isActionModel ? 'current' : rawValue.targetScope ?? 'other');

        const mergedValue: ActionStateValue = {
          targetScope,
          targetActionUid: targetScope === 'current' ? currentActionUid : rawValue.targetActionUid || '',
          stateMode,
          condition: stateMode === 'conditional' ? rawValue.condition || { logic: '$and', items: [] } : undefined,
          state: stateMode === 'direct' ? rawValue.state ?? 'visible' : undefined,
          stateWhenMet: stateMode === 'conditional' ? rawValue.stateWhenMet : undefined,
          stateWhenNotMet: stateMode === 'conditional' ? rawValue.stateWhenNotMet : undefined,
        };

        const stateOptions = [
          { label: t('Visible'), value: 'visible' },
          { label: t('Hidden'), value: 'hidden' },
          { label: t('Hidden text'), value: 'hiddenText' },
          { label: t('Enabled'), value: 'enabled' },
          { label: t('Disabled'), value: 'disabled' },
        ];

        const updateValue = (partial: Partial<ActionStateValue>) => {
          onChange({
            ...mergedValue,
            ...partial,
          });
        };

        const handleTargetScopeChange = (event: RadioChangeEvent) => {
          const scope = event.target.value as 'current' | 'other';
          updateValue({
            targetScope: scope,
            targetActionUid: scope === 'current' ? currentActionUid : '',
          });
        };

        const handleTargetActionUidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          updateValue({ targetActionUid: event.target.value });
        };

        const handleStateModeChange = (event: RadioChangeEvent) => {
          const nextMode = event.target.value as 'conditional' | 'direct';
          updateValue({
            stateMode: nextMode,
            condition: nextMode === 'conditional' ? mergedValue.condition ?? { logic: '$and', items: [] } : undefined,
            state: nextMode === 'direct' ? mergedValue.state ?? 'visible' : undefined,
            stateWhenMet: nextMode === 'conditional' ? mergedValue.stateWhenMet : undefined,
            stateWhenNotMet: nextMode === 'conditional' ? mergedValue.stateWhenNotMet : undefined,
          });
        };

        const handleConditionChange = (condition: FilterGroupType) => {
          updateValue({ condition });
        };

        const handleStateChange = (state?: ActionState) => {
          updateValue({ state });
        };

        const handleStateWhenMetChange = (state?: ActionState) => {
          updateValue({ stateWhenMet: state });
        };

        const handleStateWhenNotMetChange = (state?: ActionState) => {
          updateValue({ stateWhenNotMet: state });
        };

        const renderSectionLabel = (text: string) => (
          <div style={{ marginBottom: '4px', fontSize: '14px' }}>{text}</div>
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              {renderSectionLabel(t('Select target action'))}
              {isActionModel ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Radio.Group value={mergedValue.targetScope} onChange={handleTargetScopeChange}>
                    <Radio value="current">{t('Current action')}</Radio>
                    <Radio value="other">{t('Other action')}</Radio>
                  </Radio.Group>
                  {mergedValue.targetScope === 'other' && (
                    <Input
                      value={mergedValue.targetActionUid || ''}
                      onChange={handleTargetActionUidChange}
                      placeholder={t('Please input target action uid')}
                    />
                  )}
                </div>
              ) : (
                <Input
                  value={mergedValue.targetActionUid || ''}
                  onChange={handleTargetActionUidChange}
                  placeholder={t('Please input target action uid')}
                />
              )}
            </div>
            <div>
              {renderSectionLabel(t('Select mode'))}
              <Radio.Group value={mergedValue.stateMode} onChange={handleStateModeChange}>
                <Radio value="direct">{t('Without condition')}</Radio>
                <Radio value="conditional">{t('With condition')}</Radio>
              </Radio.Group>
            </div>
            {mergedValue.stateMode === 'conditional' ? (
              <>
                <div>
                  {renderSectionLabel(t('Set condition'))}
                  <ConditionBuilder value={mergedValue.condition} onChange={handleConditionChange} />
                </div>
                <div>
                  {renderSectionLabel(t('When condition is met'))}
                  <Select
                    value={mergedValue.stateWhenMet}
                    onChange={handleStateWhenMetChange}
                    placeholder={t('Please select state')}
                    style={{ width: '100%' }}
                    options={stateOptions}
                    allowClear
                  />
                </div>
                <div>
                  {renderSectionLabel(t('When condition is not met'))}
                  <Select
                    value={mergedValue.stateWhenNotMet}
                    onChange={handleStateWhenNotMetChange}
                    placeholder={t('Please select state')}
                    style={{ width: '100%' }}
                    options={stateOptions}
                    allowClear
                  />
                </div>
              </>
            ) : (
              <div>
                {renderSectionLabel(t('Set state'))}
                <Select
                  value={mergedValue.state}
                  onChange={handleStateChange}
                  placeholder={t('Please select state')}
                  style={{ width: '100%' }}
                  options={stateOptions}
                  allowClear
                />
              </div>
            )}
          </div>
        );
      },
    },
  },
  handler(ctx, { value }) {
    const params: ActionStateValue = value || {};
    const targetScope = params.targetScope ?? 'current';
    const targetActionUid = params.targetActionUid;
    const stateMode = params.stateMode ?? 'direct';
    const condition = params.condition;
    const state = params.state;
    const stateWhenMet = params.stateWhenMet;
    const stateWhenNotMet = params.stateWhenNotMet;

    // 解析目标操作
    const targetModel = resolveTargetAction(ctx, targetScope, targetActionUid);
    if (!targetModel) {
      console.warn('SetTargetActionState: target action model not found', targetActionUid);
      return;
    }

    // 确定最终状态
    const finalState = (() => {
      if (stateMode === 'direct') {
        return state ?? 'visible';
      }

      const conditionResult = evaluateConditionGroup(ctx, condition);
      return conditionResult ? stateWhenMet : stateWhenNotMet;
    })();

    if (!finalState) {
      return;
    }

    // 应用状态
    applyActionState(targetModel, finalState);
  },
});

const resolveTargetAction = (ctx: any, targetScope: 'current' | 'other', targetActionUid?: string) => {
  if (targetScope === 'current') {
    return ctx.model;
  }

  if (!targetActionUid) {
    return null;
  }

  // 尝试通过 engine 查找目标操作
  return ctx.engine.getModel?.(targetActionUid, true) || null;
};

const evaluateConditionGroup = (ctx: any, condition?: FilterGroupType) => {
  if (!condition) {
    return true;
  }

  try {
    const evaluator = (path: string, operator: string, value: any) => {
      if (!operator) {
        return true;
      }
      return ctx.app.jsonLogic.apply({ [operator]: [path, value] });
    };

    return evaluateConditions(condition, evaluator);
  } catch (error) {
    console.warn('Failed to evaluate conditions:', error);
    return false;
  }
};

const applyActionState = (targetModel: any, state: ActionState) => {
  switch (state) {
    case 'visible':
      targetModel.hidden = false;
      break;
    case 'hidden':
      targetModel.hidden = true;
      break;
    case 'hiddenText':
      targetModel.setProps('title', '');
      break;
    case 'enabled':
      targetModel.setProps({ disabled: false });
      break;
    case 'disabled':
      targetModel.setProps({ disabled: true });
      break;
  }
};
