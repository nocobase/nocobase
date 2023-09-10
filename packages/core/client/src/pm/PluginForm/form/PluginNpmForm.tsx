import { ISchema } from '@formily/json-schema';
import { useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { App } from 'antd';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { pick } from 'lodash';
import { useAPIClient, useRequest } from '../../../api-client';
import { SchemaComponent } from '../../../schema-component';
import { IPluginData } from '../../types';

interface IPluginNpmFormProps {
  onClose: (refresh?: boolean) => void;
  isUpgrade: boolean;
  pluginData?: IPluginData;
}

export const PluginNpmForm: FC<IPluginNpmFormProps> = ({ onClose, isUpgrade, pluginData }) => {
  const { message } = App.useApp();
  // const { data, loading } = useRequest<{ data: string[] }>(
  //   {
  //     url: `/pm:npmVersionList/${pluginData?.name}`,
  //   },
  //   {
  //     refreshDeps: [pluginData?.name],
  //     ready: !!pluginData?.name,
  //   },
  // );

  const versionList = [];
  // useMemo(() => {
  //   return data?.data.map((item) => ({ label: item, value: item })) || [];
  // }, [data?.data]);

  const useSaveValues = () => {
    const api = useAPIClient();
    const { t } = useTranslation();
    const form = useForm();

    return {
      async run() {
        await form.submit();
        api.request({
          url: isUpgrade ? 'pm:update' : 'pm:add',
          method: 'post',
          data: {
            ...form.values,
          },
        });
        onClose(true);
      },
    };
  };

  const useValuesFromProps = (options) => {
    return useRequest(
      () =>
        Promise.resolve({
          data: isUpgrade ? pick(pluginData, ['name', 'packageName', 'version']) : {},
        }),
      options,
    );
  };

  const useCancel = () => {
    return {
      run() {
        onClose();
      },
    };
  };
  const schema = useMemo<ISchema>(() => {
    const id = uid();
    const schema = {
      type: 'object',
      properties: {
        [id]: {
          'x-decorator': 'Form',
          'x-component': 'div',
          type: 'void',
          'x-decorator-props': {
            useValues: '{{ useValuesFromProps }}',
          },
          properties: {
            packageName: {
              type: 'string',
              title: "{{t('Npm package name')}}",
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              required: true,
              'x-component-props': {
                disabled: true,
              },
            },
            registry: {
              type: 'string',
              title: "{{t('Registry url')}}",
              default: 'https://registry.npmjs.org/',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              // required: true,
              'x-decorator-props': {
                tooltip: 'Example: https://registry.npmjs.org/',
              },
            },
            authToken: {
              type: 'string',
              title: "{{t('Npm authToken')}}",
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
            version: {
              type: 'string',
              title: "{{t('Version')}}",
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              // enum: '{{versionList}}',
            },
            footer: {
              type: 'void',
              'x-component': 'ActionBar',
              'x-component-props': {
                layout: 'one-column',
                style: {
                  justifyContent: 'right',
                },
              },
              properties: {
                cancel: {
                  title: 'Cancel',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ useCancel }}',
                  },
                },
                submit: {
                  title: '{{t("Submit")}}',
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'primary',
                    htmlType: 'submit',
                    useAction: '{{ useSaveValues }}',
                  },
                },
              },
            },
          },
        },
      },
    };

    schema.properties[id].properties.packageName['x-component-props'].disabled = isUpgrade;
    if (!isUpgrade) {
      delete schema.properties[id].properties['version'];
    }
    return schema;
  }, [isUpgrade]);
  // if (loading) {
  //   return <Spin />;
  // }
  return <SchemaComponent scope={{ useCancel, useSaveValues, versionList, useValuesFromProps }} schema={schema} />;
};
PluginNpmForm.displayName = 'PluginNpmForm';
