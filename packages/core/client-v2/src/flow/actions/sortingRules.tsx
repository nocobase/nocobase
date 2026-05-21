/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr, MultiRecordResource } from '@nocobase/flow-engine';

const getSortFields = (fields) => {
  return fields
    .filter((field: any) => {
      if (!field.interface) {
        return false;
      }
      const fieldInterface = field.getInterfaceOptions();
      if (fieldInterface?.sortable) {
        return true;
      }
      return false;
    })
    .map((field: any) => {
      return {
        value: field.name,
        label: field?.uiSchema?.title || field.name,
      };
    });
};

export const sortingRule = defineAction({
  name: 'sortingRule',
  title: tExpr('Default sorting'),
  uiSchema: (ctx) => {
    const fields = ctx.collectionField?.targetCollection
      ? ctx.collectionField.targetCollection.getFields()
      : ctx.blockModel.collection.getFields();
    const sortFields = getSortFields(fields);
    return {
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
                  'x-component': 'Select',
                  'x-component-props': {
                    style: {
                      width: 260,
                    },
                  },
                  enum: sortFields,
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
                      label: tExpr('ASC'),
                      value: 'asc',
                    },
                    {
                      label: tExpr('DESC'),
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
            title: tExpr('Add sort field'),
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
    };
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
    ctx.model.setProps({
      globalSort: sortArr,
    });
    resource.setSort(sortArr);
  },
});
