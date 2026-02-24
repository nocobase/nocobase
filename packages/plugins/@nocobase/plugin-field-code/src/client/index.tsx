/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lazy } from 'react';
import { useField, useFieldSchema } from '@formily/react';
import { ISchema, Plugin, SchemaSettings, useColumnSchema, useDesignable } from '@nocobase/client';
import { CodeFieldInterface } from './interface';
import { NAMESPACE } from '../common/constants';
import { lang } from './lang';

const CodeEditor = lazy(() => import('./CodeEditor'));

export const codeComponentSettings = new SchemaSettings({
  name: 'fieldSettings:component:CodeEditor',
  items: [
    {
      name: 'height',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const fieldSchema = useFieldSchema();
        const { fieldSchema: tableColumnSchema } = useColumnSchema() || {};
        const { dn } = useDesignable();
        const fSchema = tableColumnSchema || fieldSchema;

        return {
          title: lang('Content height'),
          schema: {
            type: 'object',
            title: lang('Content height'),
            properties: {
              height: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
                default: fieldSchema?.['x-component-props']?.['height'] || 'auto',
                description: `{{t('Could use CSS values (e.g., "300px" or "50%"). Use "auto" for automatic height adjustment based on content.', { ns: "${NAMESPACE}" })}}`,
              },
            },
          } as ISchema,
          onSubmit: ({ height }) => {
            const props = fSchema['x-component-props'] || {};
            props['height'] = height;
            const schema: ISchema = {
              ['x-uid']: fSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            fSchema['x-component-props'] = props;
            field.componentProps.height = height;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'indentUnit',
      type: 'modal',
      useComponentProps() {
        const field: any = useField();
        const fieldSchema = useFieldSchema();
        const { fieldSchema: tableColumnSchema } = useColumnSchema() || {};
        const { dn } = useDesignable();
        const fSchema = tableColumnSchema || fieldSchema;

        return {
          title: lang('Indent unit'),
          schema: {
            type: 'object',
            title: lang('Indent unit'),
            properties: {
              indentUnit: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
                default: fieldSchema?.['x-component-props']?.['indentUnit'] || 2,
              },
            },
          } as ISchema,
          onSubmit: ({ indentUnit }) => {
            const props = fSchema['x-component-props'] || {};
            props['indentUnit'] = indentUnit;
            const schema: ISchema = {
              ['x-uid']: fSchema['x-uid'],
            };
            schema['x-component-props'] = props;
            fSchema['x-component-props'] = props;
            field.componentProps.indentUnit = indentUnit;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
  ],
});

export class PluginFieldCodeClient extends Plugin {
  // You can get and modify the app instance here
  async load() {
    this.app.addComponents({
      CodeEditor,
    });

    this.app.dataSourceManager.addFieldInterfaces([CodeFieldInterface]);
    this.app.schemaSettingsManager.add(codeComponentSettings);
  }
}

export default PluginFieldCodeClient;
