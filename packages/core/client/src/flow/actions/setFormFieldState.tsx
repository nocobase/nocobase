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
import { FormBlockModel } from '../models/blocks/form/FormBlockModel';

type FormFieldStateValue = {
  fields: string[];
  targetFormUid?: string;
  condition?: FilterGroupType;
  stateWhenMet?: string;
  stateWhenNotMet?: string;
};

export const setFormFieldState = defineAction({
  name: 'setFormFieldState',
  title: escapeT('Set form field state'),
  scene: ActionScene.DYNAMIC_EVENT_FLOW,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value: rawValue = { fields: [] }, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const isFormBlockModel = ctx.model instanceof FormBlockModel;
        const targetFormUidFromContext = isFormBlockModel ? ctx.model.uid : undefined;
        const mergedValue: FormFieldStateValue = {
          fields: rawValue.fields || [],
          targetFormUid: rawValue.targetFormUid ?? targetFormUidFromContext,
          condition: rawValue.condition || { logic: '$and', items: [] },
          stateWhenMet: rawValue.stateWhenMet,
          stateWhenNotMet: rawValue.stateWhenNotMet,
        };

        const fieldOptions = getFormFields(ctx, mergedValue.targetFormUid);

        // 状态选项
        const stateOptions = [
          { label: t('Visible'), value: 'visible' },
          { label: t('Hidden'), value: 'hidden' },
          { label: t('Hidden (reserved value)'), value: 'hiddenReservedValue' },
          { label: t('Required'), value: 'required' },
          { label: t('Not required'), value: 'notRequired' },
          { label: t('Disabled'), value: 'disabled' },
          { label: t('Enabled'), value: 'enabled' },
        ];

        const updateValue = (partial: Partial<FormFieldStateValue>) => {
          onChange({
            ...mergedValue,
            ...partial,
          });
        };

        const handleFieldsChange = (selectedFields: string[]) => {
          updateValue({ fields: selectedFields });
        };

        const handleStateWhenMetChange = (selectedState?: string) => {
          updateValue({ stateWhenMet: selectedState });
        };

        const handleStateWhenNotMetChange = (selectedState?: string) => {
          updateValue({ stateWhenNotMet: selectedState });
        };

        const handleConditionChange = (condition: FilterGroupType) => {
          updateValue({ condition });
        };

        const handleTargetModeChange = (event: RadioChangeEvent) => {
          const mode = event.target.value as 'current' | 'other';
          if (mode === 'current' && targetFormUidFromContext) {
            updateValue({ targetFormUid: targetFormUidFromContext });
            return;
          }

          if (mode === 'other' && mergedValue.targetFormUid === targetFormUidFromContext) {
            updateValue({ targetFormUid: '' });
          }
        };

        const handleTargetFormUidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          updateValue({ targetFormUid: event.target.value });
        };

        const targetMode =
          isFormBlockModel && mergedValue.targetFormUid === targetFormUidFromContext ? 'current' : 'other';

        const shouldShowTargetFormInput = !isFormBlockModel || targetMode === 'other';

        const renderSectionLabel = (text: string) => (
          <div style={{ marginBottom: '4px', fontSize: '14px' }}>{text}</div>
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              {renderSectionLabel(t('Target form block'))}
              {isFormBlockModel ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Radio.Group value={targetMode} onChange={handleTargetModeChange}>
                    <Radio value="current">{t('Current form')}</Radio>
                    <Radio value="other">{t('Other form')}</Radio>
                  </Radio.Group>
                  {shouldShowTargetFormInput && (
                    <Input
                      value={mergedValue.targetFormUid || ''}
                      onChange={handleTargetFormUidChange}
                      placeholder={t('Please input target form uid')}
                    />
                  )}
                </div>
              ) : (
                <Input
                  value={mergedValue.targetFormUid || ''}
                  onChange={handleTargetFormUidChange}
                  placeholder={t('Please input target form uid')}
                />
              )}
            </div>
            <div>
              {renderSectionLabel(t('Form fields'))}
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
              {renderSectionLabel(t('Condition'))}
              <ConditionBuilder value={mergedValue.condition as FilterGroupType} onChange={handleConditionChange} />
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
          </div>
        );
      },
    },
  },
  handler: async (ctx, { value }) => {
    const params: FormFieldStateValue = value || { fields: [] };
    const { fields, targetFormUid, condition, stateWhenMet, stateWhenNotMet } = params;

    if (!Array.isArray(fields) || fields.length === 0) {
      return;
    }

    const targetModel = resolveTargetFormModel(ctx, targetFormUid);
    if (!targetModel) {
      console.warn('setFormFieldState: target form model not found', targetFormUid);
      return;
    }

    const conditionResult = evaluateConditionGroup(ctx, await ctx.resolveJsonTemplate(condition));
    const nextState = conditionResult ? stateWhenMet : stateWhenNotMet;

    if (!nextState) {
      return;
    }

    const props = getStateProps(nextState);
    if (!props) {
      console.warn(`setFormFieldState: unknown state ${nextState}`);
      return;
    }

    const gridItems = targetModel?.subModels?.grid?.subModels?.items || [];

    for (const uid of fields) {
      try {
        const fieldModel = gridItems.find((model: any) => model.uid === uid);
        if (!fieldModel) {
          continue;
        }

        fieldModel.setProps(props);
        if ('hiddenModel' in props) {
          fieldModel.hidden = !!props.hiddenModel;
        }
      } catch (error) {
        console.warn(`Failed to set props for field ${uid}:`, error);
      }
    }
  },
});

// 获取表单中所有字段的 model 实例的通用函数
const getFormFields = (ctx: any, targetFormUid?: string) => {
  try {
    let targetModel = ctx.model;

    if (targetFormUid) {
      targetModel = ctx.model?.uid === targetFormUid ? ctx.model : ctx.engine.getModel?.(targetFormUid, true);
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

const resolveTargetFormModel = (ctx: any, targetFormUid?: string) => {
  if (targetFormUid) {
    if (ctx.model?.uid === targetFormUid) {
      return ctx.model;
    }
    return ctx.engine.getModel?.(targetFormUid, true);
  }
  return ctx.model;
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

const getStateProps = (state: string) => {
  switch (state) {
    case 'visible':
      return { hiddenModel: false };
    case 'hidden':
      return { hiddenModel: true };
    case 'hiddenReservedValue':
      return { hidden: true };
    case 'required':
      return { required: true };
    case 'notRequired':
      return { required: false };
    case 'disabled':
      return { disabled: true };
    case 'enabled':
      return { disabled: false };
    default:
      return null;
  }
};
