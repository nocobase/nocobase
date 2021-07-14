/**
 * title: 按钮操作
 * desc: 可以通过配置 `useAction` 来处理操作逻辑
 */
import React from 'react';
// @ts-ignore
import { SchemaRenderer } from '@nocobase/client';

function useAction() {
  return {
    run() {
      alert('这是自定义的操作逻辑');
    },
  };
}

const schema = {
  type: 'void',
  name: 'action1',
  title: '按钮',
  'x-component': 'Action',
  'x-designable-bar': 'Action.DesignableBar',
  'x-component-props': {
    useAction: '{{ useAction }}',
  },
};

export default () => {
  return <SchemaRenderer debug={true} scope={{ useAction }} schema={schema} />;
};
