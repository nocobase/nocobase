/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, tExpr } from '@nocobase/flow-engine';
import { Tag } from 'antd';
import React from 'react';
import { castArray } from 'lodash';
import { ClickableFieldModel } from './ClickableFieldModel';
import { Icon } from '../../../icon';

interface FieldNames {
  value: string;
  label?: string;
}

interface Option {
  value: any;
  label: any;
}

function getCurrentOptions(value: any | any[], options: any[] = [], fieldNames: FieldNames): Option[] {
  const values = Array.isArray(value) ? value : [value];
  return values.map((val) => {
    const found = options?.find?.((opt) => opt[fieldNames.value] == val);
    return (
      found ?? {
        value: val,
        label: val?.toString?.() ?? val,
      }
    );
  });
}

const fieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
};

export class DisplayEnumFieldModel extends ClickableFieldModel {
  isEmpty(value: any) {
    return value === null || value === undefined || value === '';
  }

  public renderComponent(value) {
    const { options = [], dataSource } = this.props;
    const currentOptions = getCurrentOptions(value, dataSource || options, fieldNames);

    if (this.isEmpty(value) || !currentOptions.length) {
      return null;
    }
    return currentOptions.map((option) => (
      <Tag key={option[fieldNames.value]} color={option[fieldNames.color]} icon={<Icon type={option['icon']} />}>
        {this.translate(option[fieldNames.label])}
      </Tag>
    ));
  }
}
DisplayEnumFieldModel.define({
  label: tExpr('Select'),
});

DisplayEnumFieldModel.registerFlow({
  key: 'displayCollectionSelectSettings',
  sort: 6000,
  steps: {
    init: {
      handler(ctx) {
        if (['collection', 'tableoid'].includes(ctx.collectionField.interface)) {
          if (ctx.model.props.isTableOid) {
            const childCollections = ctx.dataSourceManager
              .getDataSource('main')
              .collectionManager.getChildrenCollections(ctx.collectionField.collectionName);
            const options = castArray(ctx.collectionField.collection)
              .concat(childCollections)
              .map((item) => {
                return {
                  label: item.title || item.name,
                  value: item.name || item.value,
                };
              });
            ctx.model.setProps({
              options: options,
            });
          } else {
            const collections = ctx.dataSourceManager.getDataSource('main').getCollections();
            const defaultOptions = ctx.model.context.collectionField.enum || [];
            const options = collections
              .filter((item: any) => !item.options.hidden)
              .filter((v) => {
                if (defaultOptions.length) {
                  return defaultOptions.find((c) => c.value === v.name);
                }
                return true;
              })
              .map((item: any) => ({
                label: item.title || item.name,
                value: item.name || item.value,
                color: item.category?.color,
              }));
            ctx.model.setProps({
              dataSource: options,
            });
          }
        }
      },
    },
  },
});

DisplayItemModel.bindModelToInterface(
  'DisplayEnumFieldModel',
  ['select', 'multipleSelect', 'radioGroup', 'checkboxGroup', 'collection', 'tableoid'],
  {
    isDefault: true,
  },
);
