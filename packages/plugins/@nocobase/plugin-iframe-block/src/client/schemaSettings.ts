import { ISchema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaSettings, useAPIClient, useDesignable } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

/**
 * @deprecated
 */
export const iframeBlockSchemaSettings_deprecated = new SchemaSettings({
  name: 'iframeBlockSchemaSettings',
  items: [
    {
      name: 'EditIframe',
      type: 'modal',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const api = useAPIClient();
        const { mode, url, htmlId, height = '60vh' } = fieldSchema['x-component-props'] || {};

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

        const submitHandler = async ({ mode, url, html, height }) => {
          const componentProps = fieldSchema['x-component-props'] || {};
          componentProps['mode'] = mode;
          componentProps['height'] = height;
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

        return {
          title: t('Edit iframe'),
          asyncGetInitialValues: async () => {
            const values = {
              mode,
              url,
              height,
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
                  { value: 'html', label: t('html') },
                ],
              },
              url: {
                title: t('URL'),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                required: true,
                'x-reactions': {
                  dependencies: ['mode'],
                  fulfill: {
                    state: {
                      hidden: '{{$deps[0] === "html"}}',
                    },
                  },
                },
              },
              html: {
                title: t('html'),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input.TextArea',
                required: true,
                'x-reactions': {
                  dependencies: ['mode'],
                  fulfill: {
                    state: {
                      hidden: '{{$deps[0] === "url"}}',
                    },
                  },
                },
              },
              height: {
                title: t('Height'),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                required: true,
              },
            },
          } as ISchema,
          onSubmit: submitHandler,
        };
      },
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
});

export const iframeBlockSchemaSettings = new SchemaSettings({
  name: 'blockSettings:iframe',
  items: [
    {
      name: 'EditIframe',
      type: 'modal',
      useComponentProps() {
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const api = useAPIClient();
        const { mode, url, htmlId, height = '60vh' } = fieldSchema['x-component-props'] || {};

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

        const submitHandler = async ({ mode, url, html, height }) => {
          const componentProps = fieldSchema['x-component-props'] || {};
          componentProps['mode'] = mode;
          componentProps['height'] = height;
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

        return {
          title: t('Edit iframe'),
          asyncGetInitialValues: async () => {
            const values = {
              mode,
              url,
              height,
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
                  { value: 'html', label: t('html') },
                ],
              },
              url: {
                title: t('URL'),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                required: true,
                'x-reactions': {
                  dependencies: ['mode'],
                  fulfill: {
                    state: {
                      hidden: '{{$deps[0] === "html"}}',
                    },
                  },
                },
              },
              html: {
                title: t('html'),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input.TextArea',
                required: true,
                'x-reactions': {
                  dependencies: ['mode'],
                  fulfill: {
                    state: {
                      hidden: '{{$deps[0] === "url"}}',
                    },
                  },
                },
              },
              height: {
                title: t('Height'),
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                required: true,
              },
            },
          } as ISchema,
          onSubmit: submitHandler,
        };
      },
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
});
