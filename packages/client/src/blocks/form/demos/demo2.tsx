/**
 * title: 更新数据表单
 * desc: 设置 `resource` 的 `resourceKey` 参数
 */
import React from 'react';
import { FormBlock } from '@nocobase/client';

export default () => {
  return (
    <FormBlock
      resource={{
        resourceName: 'users',
        resourceKey: 1,
      }}
      fields={[
        {
          interface: 'string',
          type: 'string',
          title: `单行文本`,
          name: 'username',
          required: true,
          default: 'abcdefg',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'please enter',
          },
        },
      ]}
      effects={{
        onFormValuesChange(form) {
          console.log('aaaa', form.values);
        },
      }}
    />
  );
};
