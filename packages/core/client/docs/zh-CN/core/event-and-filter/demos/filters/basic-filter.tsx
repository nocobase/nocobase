import { Card, Space } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { IFilter, FilterHandlerContext, SchemaComponent, Checkbox, FormItem } from '@nocobase/client';
import { createForm, onFormValuesChange } from '@formily/core';
import { FormContext } from '@formily/react';

const caseConvertFilter: IFilter = {
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
  handler: async (text, params, context: FilterHandlerContext) => {
    if (typeof text === 'string') {
      if (params.uppercase) {
        return text.toUpperCase();
      } else {
        return text.toLowerCase();
      }
    }
    return text;
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
    caseConvertFilter
      .handler(props.inputText, params, {})
      .then((result) => {
        if (!unmounted) {
          setOutputText(result);
        }
      })
      .catch(() => {});
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
