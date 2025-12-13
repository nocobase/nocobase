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

export class SelectFieldModel extends FieldModel {
  render() {
    const options = this.props.options?.map((v) => {
      return {
        ...v,
        label: this.translate(v.label),
      };
    });

    // TODO: 移动端相关的代码需迁移到单独的插件中
    if (this.context.isMobileLayout) {
      return <MobileSelect {...this.props} options={options} />;
    }

    return (
      <Select
        {...this.props}
        options={options}
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
