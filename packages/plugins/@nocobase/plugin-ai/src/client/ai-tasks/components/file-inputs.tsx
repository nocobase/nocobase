/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ArrayCollapse, FormLayout } from '@formily/antd-v5';
import { SchemaComponent } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client';
import { namespace } from '../../locale';

export const FileInputs: React.FC = () => {
  return (
    <SchemaComponent
      components={{ ArrayCollapse, FormLayout, WorkflowVariableInput }}
      schema={{
        type: 'void',
        properties: {
          files: {
            title: tExpr('Attachments', { ns: namespace }),
            type: 'array',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip: tExpr('Select the file or image to be sent to the LLM', { ns: namespace }),
            },
            'x-component': 'ArrayCollapse',
            'x-component-props': {
              size: 'small',
            },
            items: {
              type: 'object',
              'x-component': 'ArrayCollapse.CollapsePanel',
              'x-component-props': {
                header: tExpr('Files', { ns: namespace }),
              },
              properties: {
                index: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.Index',
                },
                form: {
                  type: 'void',
                  'x-component': 'FormLayout',
                  'x-component-props': {
                    layout: 'vertical',
                  },
                  properties: {
                    type: {
                      title: tExpr('Attachment Type', { ns: namespace }),
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      enum: [
                        { label: tExpr('File (load via Files collection)', { ns: namespace }), value: 'file_id' },
                        { label: tExpr('File (load via URL)', { ns: namespace }), value: 'file_url' },
                      ],
                      default: 'file_id',
                    },
                    collection: {
                      type: 'string',
                      title: '{{t("Collection")}}',
                      'x-reactions': [
                        {
                          dependencies: ['.type'],
                          fulfill: {
                            schema: {
                              'x-visible': '{{$deps[0] === "file_id"}}',
                            },
                            state: {
                              required: '{{$deps[0] === "file_id"}}',
                            },
                          },
                        },
                      ],
                      'x-decorator': 'FormItem',
                      'x-component': 'DataSourceCollectionCascader',
                      'x-component-props': {
                        dataSourceFilter(item) {
                          return item.options.key === 'main';
                        },
                        collectionFilter(collection) {
                          return collection.options.template === 'file';
                        },
                      },
                    },
                    value: {
                      title: tExpr('ID', { ns: namespace }),
                      type: 'string',
                      'x-reactions': [
                        {
                          dependencies: ['.type'],
                          fulfill: {
                            schema: {
                              title: `{{ $deps[0] === "file_url" ? t("URL") : t("ID") }}`,
                            },
                          },
                        },
                      ],
                      'x-decorator': 'FormItem',
                      'x-component': 'WorkflowVariableInput',
                      'x-component-props': {
                        changeOnSelect: true,
                      },
                      required: true,
                    },
                  },
                },
                moveUp: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.MoveUp',
                },
                moveDown: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.MoveDown',
                },
                remove: {
                  type: 'void',
                  'x-component': 'ArrayCollapse.Remove',
                },
              },
            },
            properties: {
              addition: {
                type: 'void',
                title: tExpr('Add file', { ns: namespace }),
                'x-component': 'ArrayCollapse.Addition',
                'x-component-props': {
                  defaultValue: { type: 'file_id' },
                },
              },
            },
          },
        },
      }}
    />
  );
};
