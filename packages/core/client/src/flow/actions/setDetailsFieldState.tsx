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
import { DetailsBlockModel } from '../models/blocks/details/DetailsBlockModel';

type FieldState = 'visible' | 'hidden' | 'hiddenReservedValue';

type FieldStateValue = {
  targetScope: 'current' | 'other';
  targetBlockUid?: string;
  fields: string[];
  stateMode?: 'conditional' | 'direct';
  condition?: FilterGroupType;
  state?: FieldState;
  stateWhenMet?: FieldState;
  stateWhenNotMet?: FieldState;
};

export const setDetailsFieldState = defineAction({
  name: 'setDetailsFieldState',
  title: escapeT('Set details field state'),
  scene: ActionScene.DYNAMIC_EVENT_FLOW,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value: rawValue = {}, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const isDetailsBlockModel = ctx.model instanceof DetailsBlockModel;
        const currentBlockUid = ctx.model.uid;
        const stateMode = rawValue.stateMode ?? 'direct';
        const targetScope = rawValue.targetScope ?? (isDetailsBlockModel ? 'current' : rawValue.targetScope || 'other');

        const mergedValue: FieldStateValue = {
          targetScope,
          targetBlockUid: targetScope === 'current' ? currentBlockUid : rawValue.targetBlockUid || '',
          fields: rawValue.fields || [],
          stateMode,
          condition: stateMode === 'conditional' ? rawValue.condition || { logic: '$and', items: [] } : undefined,
          state: stateMode === 'direct' ? rawValue.state ?? 'visible' : undefined,
          stateWhenMet: stateMode === 'conditional' ? rawValue.stateWhenMet : undefined,
          stateWhenNotMet: stateMode === 'conditional' ? rawValue.stateWhenNotMet : undefined,
        };

        const fieldOptions = getFormFields(ctx, mergedValue.targetBlockUid);

        const stateOptions = [
          { label: t('Visible'), value: 'visible' },
          { label: t('Hidden'), value: 'hidden' },
          { label: t('Hidden (reserved value)'), value: 'hiddenReservedValue' },
        ];

        const updateValue = (partial: Partial<FieldStateValue>) => {
          onChange({
            ...mergedValue,
            ...partial,
          });
        };

        const handleTargetScopeChange = (event: RadioChangeEvent) => {
          const scope = event.target.value as 'current' | 'other';
          updateValue({
            targetScope: scope,
            targetBlockUid: scope === 'current' ? currentBlockUid : '',
          });
        };

        const handleTargetBlockUidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          updateValue({ targetBlockUid: event.target.value });
        };

        const handleFieldsChange = (selectedFields: string[]) => {
          updateValue({ fields: selectedFields });
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

        const handleStateChange = (state?: FieldState) => {
          updateValue({ state });
        };

        const handleStateWhenMetChange = (state?: FieldState) => {
          updateValue({ stateWhenMet: state });
        };

        const handleStateWhenNotMetChange = (state?: FieldState) => {
          updateValue({ stateWhenNotMet: state });
        };

        const renderSectionLabel = (text: string) => (
          <div style={{ marginBottom: '4px', fontSize: '14px' }}>{text}</div>
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              {renderSectionLabel(t('Select target block'))}
              {isDetailsBlockModel ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Radio.Group value={mergedValue.targetScope} onChange={handleTargetScopeChange}>
                    <Radio value="current">{t('Current block')}</Radio>
                    <Radio value="other">{t('Other block')}</Radio>
                  </Radio.Group>
                  {mergedValue.targetScope === 'other' && (
                    <Input
                      value={mergedValue.targetBlockUid || ''}
                      onChange={handleTargetBlockUidChange}
                      placeholder={t('Please input target block uid')}
                    />
                  )}
                </div>
              ) : (
                <Input
                  value={mergedValue.targetBlockUid || ''}
                  onChange={handleTargetBlockUidChange}
                  placeholder={t('Please input target block uid')}
                />
              )}
            </div>
            <div>
              {renderSectionLabel(t('Select form fields'))}
              <Select
                mode="multiple"
                value={mergedValue.fields}
                onChange={handleFieldsChange}
                placeholder={t('Please select fields')}
                style={{ width: '100%' }}
                options={fieldOptions}
                showSearch
                filterOption={(input, option) => {
                  const text = typeof option?.label === 'string' ? option.label : '';
                  return text.toLowerCase().includes(input.toLowerCase());
                }}
                allowClear
              />
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
  handler: (ctx, { value }) => {
    const params: FieldStateValue = value || { fields: [] };
    const fields = params.fields;
    const targetScope = params.targetScope ?? 'current';
    const targetBlockUid = params.targetBlockUid;
    const stateMode = params.stateMode ?? 'direct';
    const condition = params.condition;
    const state = params.state;
    const stateWhenMet = params.stateWhenMet;
    const stateWhenNotMet = params.stateWhenNotMet;

    if (!Array.isArray(fields) || fields.length === 0) {
      return;
    }

    // 解析目标区块
    const targetModel = resolveTargetBlock(ctx, targetScope, targetBlockUid);
    if (!targetModel) {
      console.warn('setDetailsFieldState: target block model not found', targetBlockUid);
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

    // 应用状态到字段
    const gridModels = targetModel?.subModels?.grid?.subModels?.items || [];
    for (const fieldUid of fields) {
      try {
        const fieldModel = gridModels.find((model: any) => model.uid === fieldUid);
        if (fieldModel) {
          applyFieldState(fieldModel, finalState);
        }
      } catch (error) {
        console.warn(`Failed to set props for field ${fieldUid}:`, error);
      }
    }
  },
});

const resolveTargetBlock = (ctx: any, targetScope: 'current' | 'other', targetBlockUid?: string) => {
  if (targetScope === 'current') {
    return ctx.model;
  }

  if (!targetBlockUid) {
    return null;
  }

  // 尝试通过 engine 查找目标区块
  return ctx.engine.getModel?.(targetBlockUid, true) || null;
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

const applyFieldState = (fieldModel: any, state: FieldState) => {
  switch (state) {
    case 'visible':
      fieldModel.hidden = false;
      fieldModel.setProps({ hidden: false });
      break;
    case 'hidden':
      fieldModel.hidden = true;
      break;
    case 'hiddenReservedValue':
      fieldModel.setProps({ hidden: true });
      break;
  }
};

// 获取表单中所有字段的 model 实例的通用函数
const getFormFields = (ctx: any, targetBlockUid?: string) => {
  try {
    let targetModel = ctx.model;

    if (targetBlockUid) {
      targetModel = ctx.model?.uid === targetBlockUid ? ctx.model : ctx.engine.getModel?.(targetBlockUid, true);
      if (!targetModel) {
        targetModel = ctx.model;
      }
    }

    const fieldModels = targetModel?.subModels?.grid?.subModels?.items || [];
    return fieldModels.map((model: any) => ({
      label: model.props.label || model.props.name,
      value: model.uid,
      model,
    }));
  } catch (error) {
    console.warn('Failed to get form fields:', error);
    return [];
  }
};
