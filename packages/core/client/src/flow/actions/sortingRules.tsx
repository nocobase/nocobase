/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, MultiRecordResource, useStepSettingContext } from '@nocobase/flow-engine';
import React from 'react';
import { Select } from 'antd';
import { tval } from '@nocobase/utils/client';
import { useCompile } from '../../schema-component';
import { useSortFields } from '../../';

const SelectOptions = (props) => {
  const {
    model: { resource },
    app,
  } = useStepSettingContext();
  const compile = useCompile();
  const sortFields = useSortFields(resource?.resourceName);
  console.log(sortFields);
  return <Select {...props} options={sortFields} />;
};
const isArrayEqualIgnoreOrder = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
export const sortingRule = defineAction({
  name: 'sortingRule',
  title: tval('Set default sorting rules'),
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
                    label: tval('ASC'),
                    value: 'asc',
                  },
                  {
                    label: tval('DESC'),
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
          title: tval('Add sort field'),
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
