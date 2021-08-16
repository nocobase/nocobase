import React, { useContext, useEffect } from 'react';
import { Button } from 'antd';
import { SchemaRenderer } from '../schema-renderer';
import { useForm } from '@formily/react';
import { Resource } from '../../resource';
import { useRequest } from 'ahooks';
import { VisibleContext } from '../../context';
import { ISchema } from '../../schemas';
import { SystemSettingsContext } from './SiteTitle';

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
      await service.refresh();
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
          title: `系统配置`,
          'x-component': 'Menu.Action',
          properties: {
            drawer1: {
              type: 'void',
              title: '系统配置',
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
                  title: '系统名称',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                },
                logo: {
                  type: 'string',
                  title: 'LOGO',
                  'x-decorator': 'FormItem',
                  'x-component': 'Upload.Attachment',
                  'x-component-props': {
                    // accept: 'jpg,png'
                  },
                },
                showLogoOnly: {
                  type: 'boolean',
                  'x-decorator': 'FormItem',
                  'x-component': 'Checkbox',
                  'x-content': '只显示 LOGO',
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
