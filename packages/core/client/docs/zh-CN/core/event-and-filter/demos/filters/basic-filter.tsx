import { Card, Space } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { IFilter, SchemaComponent, Checkbox, FormItem, BaseModel } from '@nocobase/client';
import { createForm, onFormValuesChange } from '@formily/core';
import { FormContext } from '@formily/react';

const caseConvertFilter: IFilter<BaseModel> = {
  name: 'caseConvert',
  title: '大小写转换',
  description: '将输入文本转换为大写或小写',
  uiSchema: {
    uppercase: {
      type: 'boolean',
      title: '是否转换为大写',
      default: true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
  handler: async (model, params) => {
    const text = model.getProps()['text'] as string;
    if (typeof text === 'string') {
      if (params?.uppercase) {
        model.setProps('text', text.toUpperCase());
      } else {
        model.setProps('text', text.toLowerCase());
      }
    }
  },
};

// 过滤器设置表单
const FilterSettingForm = ({ schema, initialValues, onChange }) => {
  const form = useMemo(() => {
    return createForm({
      initialValues,
      effects() {
        onFormValuesChange((form) => {
          onChange?.(form.values);
        });
      },
    });
  }, [initialValues, onChange]);

  return (
    <FormContext.Provider value={form}>
      <SchemaComponent
        schema={{ type: 'object', properties: schema }}
        components={{
          Checkbox,
          FormItem,
        }}
      />
    </FormContext.Provider>
  );
};

const BasicFilter = (props) => {
  const [outputText, setOutputText] = useState('');
  const [params, setParams] = useState({ uppercase: true });

  useEffect(() => {
    let unmounted = false;
    // 创建模型实例, 过滤器必要参数
    const model = new BaseModel('text-model');
    model.setProps({ text: props.inputText });
    
    // 执行过滤器
    const processFilter = async () => {
      await caseConvertFilter.handler(model, params, {});
      if (!unmounted) {
        setOutputText(model.getProps()['text'] as string);
      }
    };
    
    processFilter().catch(console.error);
    
    return () => {
      unmounted = true;
    };
  }, [props.inputText, params]);

  return (
    <>
      <FilterSettingForm
        schema={caseConvertFilter.uiSchema}
        initialValues={params}
        onChange={(values) => {
          setParams(values);
        }}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <span>输入： {JSON.stringify(props)}</span>
          <span>输出： {outputText}</span>
        </Space>
      </Card>
    </>
  );
};

export default function BasicFilterDemo() {
  return <BasicFilter inputText="Hello, Filter!" />;
}
