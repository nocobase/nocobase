import { createForm } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import { AntdSchemaComponentProvider, FormItem, Plugin, SchemaComponent, Variable } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { createJSONTemplateParser } from '@nocobase/json-template-parser';
import PluginVariableFiltersClient from '@nocobase/plugin-variable-helpers/client';
import { dayjs } from '@nocobase/utils/client';
import { Form } from 'antd';
import React, { useEffect, useState } from 'react';

const parser = createJSONTemplateParser();

// 定义变量作用域
const scope = [
  {
    label: 'Date',
    value: '$nDate',
    type: 'date',
    children: [
      {
        label: 'Now',
        value: 'now',
        type: 'date',
        tooltip: '当前时间：2025-03-26 10:00:00',
      },
      {
        label: 'Today',
        value: 'today',
        type: 'date',
        tooltip: '今天：2025-03-26',
      },
      {
        label: 'This Quarter',
        value: 'thisQuarter',
        type: 'date',
        tooltip: '本季度：2025Q1',
      },
      {
        label: 'This Week',
        value: 'thisWeek',
        type: 'date',
        tooltip: '本周：2025w12',
      },
      {
        label: 'Today (DateOnly)',
        value: 'today_dateOnly',
        type: 'date',
        tooltip: '今天（无时区）：2025-03-26',
      },
      {
        label: 'Today (Without TZ)',
        value: 'today_withoutTz',
        type: 'date',
        tooltip: '今天（无时区时间）：2025-03-26 00:00:00',
      },
      {
        label: 'Today (UTC)',
        value: 'today_utc',
        type: 'date',
        tooltip: '今天（UTC时间）：2025-03-26T00:00:00.000Z',
      },
    ],
  },
];

// 定义表单属性
const useFormBlockProps = () => {
  return {
    form: createForm({
      initialValues: {
        input1: '{{ $nDate.now }}',
        input2: '{{ $nDate.today | date_format: "YYYY-MM-DD" }}',
        input3: '{{ $nDate.today | date_add: 7, "day" | date_format: "YYYY-MM-DD" }}',
        input4: '{{ $nDate.today_dateOnly }}',
        input5: '{{ $nDate.today_withoutTz }}',
        input6: '{{ $nDate.today_utc }}',
      },
    }),
  };
};

// 定义表单 schema
const schema = {
  type: 'object',
  'x-component': 'FormV2',
  'x-use-component-props': 'useFormBlockProps',
  properties: {
    input1: {
      type: 'string',
      title: '基础变量选择',
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
        value: '{{ $nDate.now }}',
      },
    },
    input2: {
      type: 'string',
      title: '带格式化的变量',
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
        value: '{{ $nDate.today | date_format: "YYYY-MM-DD" }}',
      },
    },
    input3: {
      type: 'string',
      title: '带日期偏移的变量',
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
        value: '{{ $nDate.today | date_add: 7, "day" | date_format: "YYYY-MM-DD" }}',
      },
    },
    input4: {
      type: 'string',
      title: 'DateOnly 格式',
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
        value: '{{ $nDate.today_dateOnly }}',
      },
    },
    input5: {
      type: 'string',
      title: '无时区时间格式',
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
        value: '{{ $nDate.today_withoutTz }}',
      },
    },
    input6: {
      type: 'string',
      title: 'UTC 时间格式',
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
        value: '{{ $nDate.today_utc }}',
      },
    },
  },
};

// 独立组件示例
const Demo = () => {
  const [value1, setValue1] = useState('{{$nDate.now}}');
  const [value2, setValue2] = useState('{{$nDate.today | date_format: "YYYY-MM-DD"}}');
  const [value3, setValue3] = useState('{{$nDate.today | date_add: 7, "day" | date_format: "YYYY-MM-DD"}}');
  const [value4, setValue4] = useState('{{$nDate.today_dateOnly}}');
  const [value5, setValue5] = useState('{{$nDate.today_withoutTz}}');
  const [value6, setValue6] = useState('{{$nDate.today_utc}}');

  return (
    <div>
      <Form.Item label="基础变量选择">
        <Variable.Input scope={scope} value={value1} onChange={setValue1} />
      </Form.Item>
      <Form.Item label="带格式化的变量">
        <Variable.Input scope={scope} value={value2} onChange={setValue2} />
      </Form.Item>
      <Form.Item label="带日期偏移的变量">
        <Variable.Input scope={scope} value={value3} onChange={setValue3} />
      </Form.Item>
      <Form.Item label="DateOnly 格式">
        <Variable.Input scope={scope} value={value4} onChange={setValue4} />
      </Form.Item>
      <Form.Item label="无时区时间格式">
        <Variable.Input scope={scope} value={value5} onChange={setValue5} />
      </Form.Item>
      <Form.Item label="UTC 时间格式">
        <Variable.Input scope={scope} value={value6} onChange={setValue6} />
      </Form.Item>
    </div>
  );
};

// 插件定义
class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

// 创建应用实例
const app = mockApp({ plugins: [DemoPlugin, PluginVariableFiltersClient] });

export default app.getRootComponent();
