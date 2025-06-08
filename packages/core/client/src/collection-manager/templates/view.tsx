/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionTemplate } from '../../data-source/collection-template/CollectionTemplate';
import { PreviewFields } from './components/PreviewFields';
import { PreviewTable } from './components/PreviewTable';
import { getConfigurableProperties } from './properties';

export class ViewCollectionTemplate extends CollectionTemplate {
  name = 'view';
  title = '{{t("Connect to database view")}}';
  order = 4;
  color = 'yellow';
  default = {
    fields: [],
  };
  divider = true;
  configurableProperties = {
    title: {
      type: 'string',
      title: '{{ t("Collection display name") }}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },

    databaseView: {
      title: '{{t("Connect to database view")}}',
      type: 'single',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': ['{{useAsyncDataSource(loadDBViews)}}'],
      'x-disabled': '{{ !createOnly }}',
      'x-visible': '{{!createMainOnly}}',
    },
    name: {
      type: 'string',
      title: '{{t("Collection name")}}',
      required: true,
      'x-disabled': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'uid',
      description:
        "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
      'x-reactions': {
        dependencies: ['databaseView'],
        when: '{{isPG}}',
        fulfill: {
          state: {
            initialValue: '{{$deps[0]&&$deps[0].match(/^([^_]+)_(.*)$/)?.[2]}}',
          },
        },
        otherwise: {
          state: {
            value: null,
          },
        },
      },
    },
    schema: {
      type: 'string',
      'x-hidden': true,
      'x-reactions': {
        dependencies: ['databaseView'],
        when: '{{isPG}}',
        fulfill: {
          state: {
            value: "{{$deps[0] && $deps[0].split('@')?.[0]}}",
          },
        },
        otherwise: {
          state: {
            value: null,
          },
        },
      },
    },
    viewName: {
      type: 'string',
      'x-hidden': true,
      'x-reactions': {
        dependencies: ['databaseView'],
        when: '{{isPG}}',
        fulfill: {
          state: {
            value: "{{$deps[0] && $deps[0].split('@')?.[1]}}",
          },
        },
        otherwise: {
          state: {
            value: '{{$deps[0] || null}}',
          },
        },
      },
    },
    writableView: {
      type: 'boolean',
      'x-content': '{{t("Allow add new, update and delete actions")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      default: false,
      'x-visible': '{{!createMainOnly}}',
    },
    sources: {
      type: 'array',
      title: '{{ t("Source collections") }}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        multiple: true,
      },
      'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
      'x-disabled': true,
      'x-visible': '{{!createMainOnly}}',
    },
    fields: {
      type: 'array',
      'x-component': PreviewFields,
      'x-hidden': '{{ !createOnly }}',
      'x-decorator': 'FormItem',
      'x-reactions': {
        dependencies: ['name'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}', //任意层次属性都支持表达式
          },
        },
      },
      description: `{{t("Fields can only be used correctly if they are defined with an interface.")}}`,
    },
    preview: {
      type: 'void',
      'x-visible': '{{ createOnly }}',
      'x-component': PreviewTable,
      'x-reactions': {
        dependencies: ['name', 'fields'],
        fulfill: {
          schema: {
            'x-component-props': '{{$form.values}}', //任意层次属性都支持表达式
          },
        },
      },
    },
    filterTargetKey: {
      title: `{{ t("Record unique key")}}`,
      type: 'single',
      description: `{{t( "If a collection lacks a primary key, you must configure a unique record key to locate row records within a block, failure to configure this will prevent the creation of data blocks for the collection.")}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        multiple: true,
      },
      'x-reactions': ['{{useAsyncDataSource(loadFilterTargetKeys)}}'],
    },
    ...getConfigurableProperties('category', 'description'),
  };
}
