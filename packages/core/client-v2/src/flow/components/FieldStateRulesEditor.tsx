/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import type { FilterGroupType } from '@nocobase/utils/client';
import { Select } from 'antd';
import React from 'react';
import { FieldRuleItemsEditor, type FieldRuleItemBase, type FieldRuleItemRenderContext } from './FieldRuleItemsEditor';
import type { FieldAssignCascaderOption } from './fieldAssignOptions';

export type FieldStateSelectOption = {
  label: React.ReactNode;
  value: string;
};

export type FieldStateValueOption = {
  label?: React.ReactNode;
  value: unknown;
};

export interface FieldStateRuleItem extends FieldRuleItemBase {
  state?: string;
  selectedOptions?: FieldStateValueOption[];
  condition?: FilterGroupType;
}

type CollectionLike = {
  getField?: (name: string) => unknown;
  getFields?: () => unknown[];
};

export interface FieldStateRulesEditorProps {
  t: (key: string) => string;
  fieldOptions: FieldAssignCascaderOption[];
  rootCollection?: CollectionLike;
  value?: FieldStateRuleItem[];
  onChange?: (value: FieldStateRuleItem[]) => void;
  includeFormStates?: boolean;
  getTargetFieldModel?: (targetPath?: string) => unknown;
  getStateOptions: (canConfigureLimitOptions: boolean) => FieldStateSelectOption[];
  getFieldOptions: (targetModel: unknown) => FieldStateValueOption[];
  supportsLimitOptions: (targetModel: unknown) => boolean;
}

export const FieldStateRulesEditor: React.FC<FieldStateRulesEditorProps> = ({
  t,
  fieldOptions,
  rootCollection,
  value,
  onChange,
  includeFormStates = true,
  getTargetFieldModel,
  getStateOptions,
  getFieldOptions,
  supportsLimitOptions,
}) => {
  const allStateOptions = React.useMemo(() => getStateOptions(true), [getStateOptions]);

  const renderItemContent = React.useCallback(
    ({ item, index, patchItem }: FieldRuleItemRenderContext<FieldStateRuleItem>) => {
      const targetFieldModel = getTargetFieldModel?.(item.targetPath);
      const canConfigureLimitOptions =
        includeFormStates && !!targetFieldModel && supportsLimitOptions(targetFieldModel);
      const stateOptions = getStateOptions(canConfigureLimitOptions);
      const selectableOptions = targetFieldModel ? getFieldOptions(targetFieldModel) : [];

      return (
        <>
          <div>
            <div style={{ marginBottom: 4, fontSize: 14 }}>{t('State')}</div>
            <Select
              value={item.state}
              onChange={(selectedState) =>
                patchItem(index, {
                  state: selectedState,
                  selectedOptions: selectedState === 'limitOptions' ? item.selectedOptions || [] : undefined,
                })
              }
              placeholder={t('Please select state')}
              style={{ width: '100%' }}
              options={stateOptions}
              allowClear
            />
          </div>
          {item.state === 'limitOptions' && canConfigureLimitOptions ? (
            <div>
              <div style={{ marginBottom: 4, fontSize: 14 }}>{t('Options')}</div>
              <Select
                mode="multiple"
                value={(item.selectedOptions || []).map((option) => option.value)}
                onChange={(selectedValues) => {
                  patchItem(index, {
                    selectedOptions: selectableOptions.filter((option) => selectedValues.includes(option.value)),
                  });
                }}
                style={{ width: '100%' }}
                options={selectableOptions}
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                allowClear
              />
            </div>
          ) : null}
        </>
      );
    },
    [getFieldOptions, getStateOptions, getTargetFieldModel, includeFormStates, supportsLimitOptions, t],
  );

  return (
    <FieldRuleItemsEditor<FieldStateRuleItem>
      t={t}
      fieldOptions={fieldOptions}
      rootCollection={rootCollection}
      value={value}
      onChange={onChange}
      createItem={() => ({
        key: uid(),
        enable: true,
        targetPath: undefined,
        state: undefined,
        selectedOptions: undefined,
        condition: { logic: '$and', items: [] },
      })}
      getHeaderExtra={(item) => allStateOptions.find((option) => option.value === item.state)?.label}
      onTargetPathChange={({ item, targetPath }) => {
        const nextTargetModel = getTargetFieldModel?.(targetPath);
        const nextCanConfigureLimitOptions =
          includeFormStates && !!nextTargetModel && supportsLimitOptions(nextTargetModel);
        const nextState = item.state === 'limitOptions' && !nextCanConfigureLimitOptions ? undefined : item.state;
        return {
          state: nextState,
          selectedOptions: nextState === 'limitOptions' ? [] : item.selectedOptions,
          targetPath,
        };
      }}
      renderItemContent={renderItemContent}
    />
  );
};
