import { FormLayout } from '@formily/antd';
import React from 'react';
import { SchemaComponent } from '../../schema-component';

export const RoleConfigure = () => {
  return (
    <div>
      <FormLayout layout={'vertical'}>
        <SchemaComponent
          schema={{
            type: 'object',
            properties: {
              allowConfigure: {
                title: '配置权限',
                'x-decorator': 'FormItem',
                'x-component': 'Checkbox',
                'x-content': '允许配置系统，包括界面配置、数据表配置、权限配置、系统配置等全部配置项',
              },
              strategy: {
                title: '通用数据操作权限',
                description: '所有数据表都默认使用通用数据操作权限；同时，可以针对每个数据表单独配置权限。',
                'x-component': 'StrategyActions',
                'x-decorator': 'FormItem',
              },
              allowNewMenu: {
                title: '新增菜单项默认访问权限',
                'x-decorator': 'FormItem',
                'x-component': 'Checkbox',
                'x-content': '新增菜单项默认允许访问',
              },
            },
          }}
        />
      </FormLayout>
    </div>
  );
};
