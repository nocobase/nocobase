import { ISchema, useField, useFieldSchema } from '@formily/react';
import { GeneralSchemaDesigner, SchemaSettings, useDesignable } from '@nocobase/client';
import { useAsyncEffect, useSafeState } from 'ahooks';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const IframeDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const { api } = dn.options;
  const [initialValues, setInitialValues] = useSafeState({});
  const [count, setCount] = useSafeState(0);

  useAsyncEffect(async () => {
    const componentProps = fieldSchema['x-component-props'] || {};
    const { mode, url, htmlId, height = '60vh' } = componentProps;
    let html = null;
    if (mode === 'html') {
      const {
        data: { data },
      } = await api.resource('iframeHtml').get({ filterByTk: htmlId });
      html = data?.html;
    }
    setInitialValues({ mode, url, html, height });
  }, [count]);

  const refresh = () => setCount(count + 1);

  const submitHandler = async ({ mode, url, html, height }) => {
    const componentProps = fieldSchema['x-component-props'] || {};
    componentProps['mode'] = mode;
    componentProps['height'] = height;
    if (mode === 'html') {
      const { htmlId } = componentProps;
      const response = htmlId
        ? await api.resource('iframeHtml').update({
            filterByTk: htmlId,
            values: { html },
          })
        : await api.resource('iframeHtml').create({
            values: { html },
          });

      let data = response?.data?.data;
      if (Array.isArray(data)) {
        data = data[0];
      }
      componentProps['url'] = null;
      componentProps['html'] = data.html;
      componentProps['htmlId'] = data.id;
    } else {
      componentProps['url'] = url;
      componentProps['html'] = null;
      componentProps['htmlId'] = null;
    }
    fieldSchema['x-component-props'] = componentProps;
    field.componentProps = { ...componentProps };
    dn.emit('patch', {
      schema: {
        'x-uid': fieldSchema['x-uid'],
        'x-component-props': componentProps,
      },
    });
    refresh();
  };

  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.ModalItem
        title={t('Edit iframe')}
        initialValues={initialValues}
        schema={
          {
            type: 'object',
            title: t('Edit iframe'),
            properties: {
              mode: {
                title: '{{t("Mode")}}',
                'x-component': 'Radio.Group',
                'x-decorator': 'FormItem',
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
          } as ISchema
        }
        // {{ fetchData(api, { url: 'chartData:get' }) }}
        onSubmit={submitHandler}
      />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
