import { Button, Card, Space, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { Filter, FilterContext } from '../libs/types';
import { SchemaComponent, Checkbox, FormItem } from '@nocobase/client';
import { createForm, onFormValuesChange } from '@formily/core';
import { FormContext } from '@formily/react';

const caseConvertFilter: Filter = {
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
  handler: async (text, params, context: FilterContext) => {
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
        initialValues={{ uppercase: true }}
        onChange={(values) => {
          setParams({ uppercase: !!values.uppercase });
        }}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>Props: {JSON.stringify(props)}</Typography.Text>
          </div>
          <div>
            <Typography.Text strong>Filter结果:</Typography.Text>
            <div
              style={{
                padding: 8,
                border: '1px dashed #d9d9d9',
                borderRadius: 4,
                background: outputText ? '#f6ffed' : '#f0f0f0',
              }}
            >
              {outputText}
            </div>
          </div>
        </Space>
      </Card>
    </>
  );
};

export default function BasicFilterDemo() {
  return <BasicFilter inputText="Hello, Filter!" />;
}
