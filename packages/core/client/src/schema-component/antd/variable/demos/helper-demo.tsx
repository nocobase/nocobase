import { createForm } from '@formily/core';
import { observer, useField, useForm } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  FormItem,
  Plugin,
  SchemaComponent,
  useApp,
  useRequest,
  Variable,
  VariableEvaluateProvider,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { createJSONTemplateParser } from '@nocobase/json-template-parser';
import PluginVariableFiltersClient from '@nocobase/plugin-variable-helpers/client';
import { dayjs } from '@nocobase/utils/client';
import { Form } from 'antd';
import React, { useEffect, useState } from 'react';

const scope = [{ label: 'now', value: 'now', helpers: ['date.*'] }];

const Demo = () => {
  const app = useApp();
  const [value, setValue] = useState('{{now | date_format: "YYYY-MM-DD"}}');
  const [value2, setValue2] = useState('{{now |date_offset: "add", 1, "week" | date_format: "YYYY-MM-DD"}}');
  const tmplateData = { now: dayjs().format() };
  const { data } = useRequest(
    () => {
      return app.jsonTemplateParser.render(value, tmplateData);
    },
    {
      refreshDeps: [value],
    },
  );
  const { data: data2 } = useRequest(
    () => {
      return app.jsonTemplateParser.render(value2);
    },
    {
      refreshDeps: [value2],
    },
  );
  return (
    <div>
      <VariableEvaluateProvider data={tmplateData} context={{}}>
        <Form.Item label="format now" extra={`输出值${data}`}>
          <Variable.Input scope={scope} value={value} onChange={setValue}></Variable.Input>
        </Form.Item>
        <Form.Item label="offset and format" extra={`输出值${data2}`}>
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
