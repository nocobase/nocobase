/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT, MultiRecordResource, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Select } from 'antd';
import React from 'react';
import { DataBlockModel, useSortFields } from '../../';
import { useCompile } from '../../schema-component';

const SelectOptions = (props) => {
  const flowContext = useFlowSettingsContext<DataBlockModel>();
  const resource = flowContext.model.resource;
  const compile = useCompile();
  const sortFields = useSortFields(resource?.getResourceName());
  return <Select {...props} options={compile(sortFields)} />;
};

export const sortingRule = defineAction({
  name: 'sortingRule',
  title: escapeT('Default sorting'),
  uiSchema: {
    sort: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              sort: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.SortHandle',
              },
              field: {
                type: 'string',
                required: true,
                'x-decorator': 'FormItem',
                'x-component': SelectOptions,
                'x-component-props': {
                  style: {
                    width: 260,
                  },
                },
              },
              direction: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Radio.Group',
                'x-component-props': {
                  optionType: 'button',
                },
                enum: [
                  {
                    label: escapeT('ASC'),
                    value: 'asc',
                  },
                  {
                    label: escapeT('DESC'),
                    value: 'desc',
                  },
                ],
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: escapeT('Add sort field'),
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
  },
  defaultParams(ctx) {
    return {
      sort: [],
    };
  },
  async handler(ctx, params) {
    const sortArr = params.sort.map((item) => {
      return item.direction === 'desc' ? `-${item.field}` : item.field;
    });
    // @ts-ignore
    const resource = ctx.model?.resource as MultiRecordResource;
    if (!resource) {
      return;
    }
    resource.setSort(sortArr);
  },
});
