import { Plugin, Variable, VariableEvaluateProvider } from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import PluginVariableFiltersClient from '@nocobase/plugin-variable-helpers/client';
import { dayjs } from '@nocobase/utils/client';
import { Form } from 'antd';
import React, { useState } from 'react';

const scope = [
  { label: 'v1', value: 'v1' },
  { label: 'now', value: 'now', type: 'date' },
];

const tmplateData = { now: dayjs.utc().format(), v1: 'value-v1' };
const Demo = () => {
  const [value, setValue] = useState('{{now}}');
  const [value2, setValue2] = useState('{{v1}}');
  return (
    <div>
      <VariableEvaluateProvider data={tmplateData} context={{}}>
        <Form.Item label="date" extra="变量类型为 date,可以匹配 date 类型的 helpers">
          <Variable.Input scope={scope} value={value} onChange={setValue}></Variable.Input>
        </Form.Item>
        <Form.Item label="v1" extra="变量无类型，不能匹配任何 helpers">
          <Variable.Input scope={scope} value={value2} onChange={setValue2}></Variable.Input>
        </Form.Item>
      </VariableEvaluateProvider>
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

const app = mockApp({ plugins: [DemoPlugin, PluginVariableFiltersClient] });

export default app.getRootComponent();
