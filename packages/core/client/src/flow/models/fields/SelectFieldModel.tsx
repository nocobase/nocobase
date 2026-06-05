/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableItemModel, FilterableItemModel, tExpr } from '@nocobase/flow-engine';
import { Select, Tag, Tooltip } from 'antd';
import React from 'react';
import { FieldModel } from '../base';
import { MobileSelect } from './mobile-components/MobileSelect';
import { enumToOptions, getSelectedEnumLabels } from '../../internal/utils/enumOptionsUtils';

const getOriginalEnumOptions = (model: SelectFieldModel) => {
  const fromEnum = enumToOptions(model.context.collectionField?.uiSchema?.enum, (text) => text) || [];
  if (fromEnum.length > 0) {
    return fromEnum.map((option) => ({ ...option }));
  }
  const current = Array.isArray(model.props.options) ? model.props.options : [];
  return current.map((option) => ({ ...option }));
};

export class SelectFieldModel extends FieldModel {
  render() {
    const fallbackOptions = getOriginalEnumOptions(this);
    const options = this.props.options?.map((v) => {
      return {
        ...v,
        label: this.translate(v.label),
      };
    });
    const selectedLabels = getSelectedEnumLabels(this.props.value, fallbackOptions).map((item) => ({
      ...item,
      label: this.translate(item.label),
    }));
    const value = Array.isArray(this.props.value)
      ? selectedLabels
      : selectedLabels.length > 0
        ? selectedLabels[0]
        : this.props.value;

    // TODO: 移动端相关的代码需迁移到单独的插件中
    if (this.context.isMobileLayout) {
      return <MobileSelect {...this.props} options={options} displayValue={value} />;
    }

    return (
      <Select
        {...this.props}
        value={value}
        labelInValue
        onChange={(nextValue) => {
          if (Array.isArray(nextValue)) {
            this.props.onChange?.(nextValue.map((item: any) => item?.value));
            return;
          }
          this.props.onChange?.(nextValue?.value);
        }}
        options={options}
        labelRender={(item) => item.label}
        maxTagCount="responsive"
        maxTagPlaceholder={(omittedValues) => (
          <Tooltip
            title={
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  maxWidth: '100%',
                }}
              >
                {omittedValues.map((item) => (
                  <Tag
                    key={item.value}
                    style={{
                      margin: 0,
                      background: '#fafafa',
                      border: '1px solid #d9d9d9',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                    }}
                  >
                    {item.label}
                  </Tag>
                ))}
              </div>
            }
            overlayInnerStyle={{
              background: '#fff',
              color: '#000',
              padding: 8,
              maxWidth: '100%',
            }}
            color="#fff"
            overlayStyle={{
              pointerEvents: 'auto',
              maxWidth: 300,
            }}
          >
            +{omittedValues.length}...
          </Tooltip>
        )}
      />
    );
  }
}

SelectFieldModel.define({
  label: tExpr('Select'),
});
EditableItemModel.bindModelToInterface('SelectFieldModel', ['select', 'multipleSelect'], {
  isDefault: true,
  defaultProps: {
    allowClear: true,
  },
});

EditableItemModel.bindModelToInterface('SelectFieldModel', ['radioGroup'], {});

EditableItemModel.bindModelToInterface('SelectFieldModel', ['checkboxGroup'], {
  isDefault: true,
  defaultProps: {
    allowClear: true,
    mode: 'tags',
  },
});

FilterableItemModel.bindModelToInterface('SelectFieldModel', ['select', 'multipleSelect', 'radioGroup'], {
  isDefault: true,
  defaultProps: {
    allowClear: true,
  },
});

FilterableItemModel.bindModelToInterface('SelectFieldModel', ['checkboxGroup'], {
  isDefault: true,
  defaultProps: {
    allowClear: true,
    mode: 'tags',
  },
});

FilterableItemModel.bindModelToInterface('SelectFieldModel', ['checkbox'], {
  isDefault: true,
  defaultProps: (ctx) => {
    return {
      allowClear: true,
      multiple: false,
      options: [
        {
          label: '{{t("Yes")}}',
          value: true,
        },
        {
          label: '{{t("No")}}',
          value: false,
        },
      ],
    };
  },
});
