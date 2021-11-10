import React, { useContext, useEffect } from 'react';
import { Button } from 'antd';
import { SchemaRenderer } from '../schema-renderer';
import { useForm } from '@formily/react';
import { useRequest } from 'ahooks';
import { VisibleContext } from '../../context';
import { ISchema } from '../../schemas';
import { SystemSettingsContext } from './SiteTitle';
import { i18n } from '../../i18n';

const useResource = ({ onSuccess }) => {
  const { service, resource } = useContext(SystemSettingsContext);

  useEffect(() => {
    onSuccess(service.data);
  }, []);

  return { resource, service, initialValues: service.data, ...service };
};

const useOkAction = () => {
  const form = useForm();
  const { service, resource } = useContext(SystemSettingsContext);
  return {
    async run() {
      console.log('system_settings.values', form.values);
      await resource.save(form.values);
      await service.mutate(form.values);
    },
  };
};

const schema: ISchema = {
  type: 'void',
  name: 'action1',
  // title: '下拉菜单',
  'x-component': 'Action',
  'x-component-props': {
    className: 'nb-database-config',
    icon: 'MoreOutlined',
    type: 'primary',
  },
  properties: {
    dropdown1: {
      type: 'void',
      'x-component': 'Action.Dropdown',
      'x-component-props': {
        trigger: ['hover'],
      },
      properties: {
        item1: {
          type: 'void',
          title: "{{t('System settings')}}",
          'x-component': 'Menu.Action',
          'x-component-props': {
            icon: 'SettingOutlined',
          },
          properties: {
            drawer1: {
              type: 'void',
              title: "{{t('System settings')}}",
              'x-decorator': 'Form',
              'x-decorator-props': {
                useResource,
              },
              'x-component': 'Action.Drawer',
              'x-component-props': {
                useOkAction,
              },
              properties: {
                title: {
                  type: 'string',
                  title: "{{t('System title')}}",
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                },
                logo: {
                  type: 'string',
                  title: "{{t('Logo')}}",
                  'x-decorator': 'FormItem',
                  'x-component': 'Upload.Attachment',
                  'x-component-props': {
                    // accept: 'jpg,png'
                  },
                },
                appLang: {
                  type: 'string',
                  title: '{{t("Language")}}',
                  'x-component': 'Select',
                  'x-decorator': 'FormItem',
                  enum: [
                    { label: 'English', value: 'en-US' },
                    { label: '简体中文', value: 'zh-CN' },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
};

export const More = () => {
  return <SchemaRenderer schema={schema} />;
};
