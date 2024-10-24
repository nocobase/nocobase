/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  SchemaSettings,
  SchemaSettingsBlockHeightItem,
  Variable,
  useAPIClient,
  useDesignable,
  useFormBlockContext,
  useRecord,
  useURLAndHTMLSchema,
  useVariableOptions,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

const getVariableComponentWithScope = (Com) => {
  return (props) => {
    const fieldSchema = useFieldSchema();
    const { form } = useFormBlockContext();
    const record = useRecord();
    const scope = useVariableOptions({
      collectionField: { uiSchema: fieldSchema },
      form,
      record,
      uiSchema: fieldSchema,
      noDisabled: true,
    });
    return <Com {...props} scope={scope} />;
  };
};

const commonOptions: any = {
  items: [
    {
      name: 'EditIframe',
      type: 'modal',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { t, i18n } = useTranslation();
        const { dn } = useDesignable();
        const api = useAPIClient();
        const { mode, url, params, htmlId, height = '60vh', engine } = fieldSchema['x-component-props'] || {};
        const saveHtml = async (html: string) => {
          const options = {
            values: { html },
          };
          if (htmlId) {
            // eslint-disable-next-line no-unsafe-optional-chaining
            const { data } = await api.resource('iframeHtml').update?.({ ...options, filterByTk: htmlId });
            return data?.data?.[0] || { id: htmlId };
          } else {
            // eslint-disable-next-line no-unsafe-optional-chaining
            const { data } = await api.resource('iframeHtml').create?.(options);
            return data?.data;
          }
        };
        const { urlSchema, paramsSchema } = useURLAndHTMLSchema();
        const submitHandler = async ({ mode, url, html, height, params, engine }) => {
          const componentProps = fieldSchema['x-component-props'] || {};
          componentProps['mode'] = mode;
          componentProps['height'] = height;
          componentProps['engine'] = engine || 'string';
          componentProps['params'] = params;
          componentProps['url'] = url;
          if (mode === 'html') {
            const data = await saveHtml(html);
            componentProps['htmlId'] = data.id;
          }
          fieldSchema['x-component-props'] = componentProps;
          field.componentProps = { ...componentProps };
          field.data = { v: uid() };
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-component-props': componentProps,
            },
          });
        };
        // 外部定义 description 的内容
        const descriptionContent = (
          <>
            <span style={{ marginLeft: '.25em' }} className={'ant-formily-item-extra'}>
              {t('Syntax references')}:
            </span>{' '}
            <a
              href={`https://${
                i18n.language === 'zh-CN' ? 'docs-cn' : 'docs'
              }.nocobase.com/handbook/template-handlebars`}
              target="_blank"
              rel="noreferrer"
            >
              Handlebars.js
            </a>
          </>
        );

        return {
          title: t('Edit iframe'),
          asyncGetInitialValues: async () => {
            const values = {
              mode,
              url,
              height,
              engine,
              params,
            };
            if (htmlId) {
              // eslint-disable-next-line no-unsafe-optional-chaining
              const { data } = await api.resource('iframeHtml').get?.({ filterByTk: htmlId });
              values['html'] = data?.data?.html || '';
            }
            return values;
          },
          schema: {
            type: 'object',
            title: t('Edit iframe'),
            properties: {
              mode: {
                title: '{{t("Mode")}}',
                'x-component': 'Radio.Group',
                'x-decorator': 'FormItem',
                required: true,
                default: 'url',
                enum: [
                  { value: 'url', label: t('URL') },
                  { value: 'html', label: t('HTML') },
                ],
              },
              url: {
                ...urlSchema,
                required: true,
              },
              params: paramsSchema,
              engine: {
                title: '{{t("Template engine")}}',
                'x-component': 'Radio.Group',
                'x-decorator': 'FormItem',
                default: 'string',
                enum: [
                  { value: 'string', label: t('String template') },
                  { value: 'handlebars', label: t('Handlebars') },
                ],
                'x-reactions': {
                  dependencies: ['mode'],
                  fulfill: {
                    state: {
                      hidden: '{{$deps[0] === "url"}}',
                    },
                  },
                },
              },
              html: {
                title: t('html'),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': getVariableComponentWithScope(Variable.RawTextArea),
                'x-component-props': {
                  rows: 10,
                },
                required: true,
                description: descriptionContent,
                'x-reactions': [
                  {
                    dependencies: ['mode'],
                    fulfill: {
                      state: {
                        hidden: '{{$deps[0] === "url"}}',
                      },
                    },
                  },
                  (field) => {
                    const { engine } = field.form.values;
                    if (engine === 'handlebars') {
                      field.description = descriptionContent;
                    } else {
                      field.description = null;
                    }
                  },
                ],
              },
            },
          } as ISchema,
          onSubmit: submitHandler,
          noRecord: true,
        };
      },
    },
    {
      name: 'setTheBlockHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
};

/**
 * @deprecated
 */
export const iframeBlockSchemaSettings_deprecated = new SchemaSettings({
  name: 'iframeBlockSchemaSettings',
  ...commonOptions,
});

export const iframeBlockSchemaSettings = new SchemaSettings({
  name: 'blockSettings:iframe',
  ...commonOptions,
});
