/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { CollectionTemplate } from '../../data-source/collection-template/CollectionTemplate';
import { i18n } from '../../i18n';
import { FieldsConfigure, PreviewTable, SQLInput, SQLRequestProvider } from './components/sql-collection';
import { getConfigurableProperties } from './properties';

export class SqlCollectionTemplate extends CollectionTemplate {
  name = 'sql';
  title = '{{t("SQL collection")}}';
  order = 4;
  color = 'yellow';
  default = {
    fields: [],
  };
  configurableProperties = {
    title: {
      type: 'string',
      title: '{{ t("Collection display name") }}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
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
    },
    config: {
      type: 'void',
      'x-decorator': SQLRequestProvider,
      properties: {
        sql: {
          type: 'string',
          title: '{{t("SQL")}}',
          'x-decorator': 'FormItem',
          'x-component': SQLInput,
          required: true,
          'x-validator': (value: string, rules, { form }) => {
            const field = form.query('sql').take() as Field;
            if (!field.componentProps.disabled) {
              return i18n.t('Please confirm the SQL statement first');
            }
            return '';
          },
        },
        sources: {
          type: 'array',
          title: '{{t("Source collections")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-component-props': {
            multiple: true,
          },
          'x-reactions': ['{{useAsyncDataSource(loadCollections)}}'],
        },
        fields: {
          type: 'array',
          title: '{{t("Fields")}}',
          'x-decorator': 'FormItem',
          'x-component': FieldsConfigure,
          required: true,
        },
        table: {
          type: 'void',
          title: '{{t("Preview")}}',
          'x-decorator': 'FormItem',
          'x-component': PreviewTable,
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
