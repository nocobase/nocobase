/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, escapeT, useFlowContext } from '@nocobase/flow-engine';
import { Input, Radio, Select } from 'antd';
import type { RadioChangeEvent } from 'antd/es/radio';
import React from 'react';
import { evaluateConditions, FilterGroupType } from '@nocobase/utils/client';
import { FieldAssignValueInput } from '../components/FieldAssignValueInput';
import { ConditionBuilder } from '../components/ConditionBuilder';
import { FormBlockModel } from '../models/blocks/form/FormBlockModel';

type ComponentValue = {
  targetFormUid?: string;
  field?: string;
  condition?: FilterGroupType;
  valueWhenMet?: any;
  valueWhenNotMet?: any;
  assignmentMode?: 'conditional' | 'direct';
};

const createEmptyCondition = (): FilterGroupType => ({ logic: '$and', items: [] });

export const setFormFieldValue = defineAction({
  name: 'setFormFieldValue',
  title: escapeT('Set form field value'),
  scene: ActionScene.DYNAMIC_EVENT_FLOW,
  sort: 200,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value = {}, onChange } = props as { value: ComponentValue; onChange: (next: ComponentValue) => void };
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const isFormBlockModel = ctx.model instanceof FormBlockModel;
        const targetFormUidFromContext = isFormBlockModel ? ctx.model.uid : undefined;

        const assignmentMode = value.assignmentMode ?? 'direct';
        const mergedValue: ComponentValue = {
          targetFormUid: value.targetFormUid ?? targetFormUidFromContext,
          field: value.field,
          condition: assignmentMode === 'conditional' ? value.condition ?? createEmptyCondition() : undefined,
          valueWhenMet: value.valueWhenMet,
          valueWhenNotMet: assignmentMode === 'conditional' ? value.valueWhenNotMet : undefined,
          assignmentMode,
        };

        const fieldOptions = getFormFields(ctx, mergedValue.targetFormUid);

        const selectedFieldUid = mergedValue.field;
        const currentAssignmentMode = mergedValue.assignmentMode ?? 'direct';

        const handleFieldChange = (selectedField: string | undefined) => {
          const nextField = selectedField;
          const changed = nextField !== mergedValue.field;
          updateValue({
            field: nextField,
            valueWhenMet: changed ? undefined : mergedValue.valueWhenMet,
            valueWhenNotMet: changed ? undefined : mergedValue.valueWhenNotMet,
          });
        };

        const updateValue = (partial: Partial<ComponentValue>) => {
          onChange({
            ...mergedValue,
            ...partial,
          });
        };

        const handleTargetModeChange = (event: RadioChangeEvent) => {
          const mode = event.target.value as 'current' | 'other';
          if (mode === 'current' && targetFormUidFromContext) {
            updateValue({
              targetFormUid: targetFormUidFromContext,
              field: undefined,
              valueWhenMet: undefined,
              valueWhenNotMet: undefined,
            });
            return;
          }

          if (mode === 'other' && mergedValue.targetFormUid === targetFormUidFromContext) {
            updateValue({ targetFormUid: '', field: undefined, valueWhenMet: undefined, valueWhenNotMet: undefined });
          }
        };

        const handleTargetFormUidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          updateValue({
            targetFormUid: event.target.value,
            field: undefined,
            valueWhenMet: undefined,
            valueWhenNotMet: undefined,
          });
        };

        const handleConditionChange = (condition: FilterGroupType) => {
          updateValue({ condition });
        };

        const handleValueWhenMetChange = (nextValue: any) => {
          updateValue({ valueWhenMet: nextValue });
        };

        const handleValueWhenNotMetChange = (nextValue: any) => {
          updateValue({ valueWhenNotMet: nextValue });
        };

        const handleAssignmentModeChange = (event: RadioChangeEvent) => {
          const nextMode = event.target.value as 'conditional' | 'direct';
          updateValue({
            assignmentMode: nextMode,
            condition: nextMode === 'conditional' ? mergedValue.condition ?? createEmptyCondition() : undefined,
            valueWhenNotMet: nextMode === 'conditional' ? mergedValue.valueWhenNotMet : undefined,
          });
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
              {renderSectionLabel(t('Select target form block'))}
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
              {renderSectionLabel(t('Select field'))}
              <Select
                value={selectedFieldUid}
                onChange={handleFieldChange}
                placeholder={t('Please select field')}
                style={{ width: '100%' }}
                options={fieldOptions}
                showSearch
                filterOption={(input, option) =>
                  typeof option?.label === 'string' && option.label.toLowerCase().includes(input.toLowerCase())
                }
                allowClear
              />
            </div>
            {selectedFieldUid && (
              <>
                <div>
                  {renderSectionLabel(t('Assignment mode'))}
                  <Radio.Group value={currentAssignmentMode} onChange={handleAssignmentModeChange}>
                    <Radio value="direct">{t('Direct assignment')}</Radio>
                    <Radio value="conditional">{t('Conditional assignment')}</Radio>
                  </Radio.Group>
                </div>
                {currentAssignmentMode === 'conditional' ? (
                  <>
                    <div>
                      {renderSectionLabel(t('Set condition'))}
                      <ConditionBuilder
                        value={mergedValue.condition ?? createEmptyCondition()}
                        onChange={handleConditionChange}
                      />
                    </div>
                    <div>
                      {renderSectionLabel(t('When condition is met'))}
                      <div style={{ marginTop: '8px' }}>
                        <FieldAssignValueInput
                          key={`${selectedFieldUid}-met`}
                          fieldUid={selectedFieldUid}
                          value={mergedValue.valueWhenMet}
                          onChange={handleValueWhenMetChange}
                          placeholder={t('Set field value')}
                        />
                      </div>
                    </div>
                    <div>
                      {renderSectionLabel(t('When condition is not met'))}
                      <div style={{ marginTop: '8px' }}>
                        <FieldAssignValueInput
                          key={`${selectedFieldUid}-not-met`}
                          fieldUid={selectedFieldUid}
                          value={mergedValue.valueWhenNotMet}
                          onChange={handleValueWhenNotMetChange}
                          placeholder={t('Set field value')}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    {renderSectionLabel(t('Assign value'))}
                    <div style={{ marginTop: '8px' }}>
                      <FieldAssignValueInput
                        key={`${selectedFieldUid}-direct`}
                        fieldUid={selectedFieldUid}
                        value={mergedValue.valueWhenMet}
                        onChange={handleValueWhenMetChange}
                        placeholder={t('Set field value')}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      },
    },
  },
  handler: (ctx, { value }) => {
    const params: ComponentValue = value || {};
    const field = params.field;
    const targetFormUid = params.targetFormUid;
    const condition = params.condition;
    const valueWhenMet = params.valueWhenMet;
    const valueWhenNotMet = params.valueWhenNotMet;
    const assignmentMode = params.assignmentMode ?? 'direct';

    if (!field) {
      return;
    }

    const targetModel = resolveTargetFormModel(ctx, targetFormUid);
    if (!targetModel) {
      console.warn('setFormFieldValue: target form model not found', targetFormUid);
      return;
    }

    const conditionResult = evaluateConditionGroup(ctx, condition);

    const gridModels = targetModel?.subModels?.grid?.subModels?.items || [];
    const fieldModel = gridModels.find((model: any) => model.uid === field);

    if (!fieldModel) {
      return;
    }

    try {
      if (assignmentMode === 'direct') {
        if (valueWhenMet === undefined) {
          return;
        }
        if (fieldModel.context.form) {
          fieldModel.context.form.setFieldValue(fieldModel.props.name, valueWhenMet);
        }
        return;
      }

      const valueToAssign = conditionResult ? valueWhenMet : valueWhenNotMet;

      if (valueToAssign === undefined) {
        return;
      }

      if (fieldModel.context.form) {
        fieldModel.context.form.setFieldValue(fieldModel.props.name, valueToAssign);
      }
    } catch (error) {
      console.warn(`Failed to assign value to field ${field}:`, error);
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
