import React, { useContext, useEffect } from 'react';
import { Button } from 'antd';
import { SchemaRenderer } from '../schema-renderer';
import { ISchema, useForm } from '@formily/react';
import { Resource } from '../../resource';
import { useRequest } from 'ahooks';
import { VisibleContext } from '../../context';

const useResource = ({ onSuccess }) => {
  const resource = Resource.make({
    resourceName: 'system_settings',
    resourceKey: 1,
  });
  const service = useRequest(
    (params?: any) => {
      return resource.get({ ...params, appends: ['logo'] });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess,
      manual: true,
    },
  );
  const [visible] = useContext(VisibleContext);

  useEffect(() => {
    if (visible) {
      service.run({});
    }
  }, [visible]);

  return { resource, service, initialValues: service.data, ...service };
};

const useOkAction = () => {
  const form = useForm();
  return {
    async run() {
      const resource = Resource.make({
        resourceName: 'system_settings',
        resourceKey: 1,
      });
      console.log('system_settings.values', form.values)
      await resource.save(form.values);
    }
  }
}

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
              },
            },
          },
        },
      },
    }
  },
};

export const More = () => {
  return <SchemaRenderer schema={schema} />;
};
