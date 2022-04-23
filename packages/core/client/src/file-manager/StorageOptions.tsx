import { FormLayout } from '@formily/antd';
import { Field } from '@formily/core';
import { observer, RecursionField, Schema, useField, useForm } from '@formily/react';
import React, { useEffect, useState } from 'react';

const schema = {
  local: {
    properties: {
      documentRoot: {
        title: '{{t("Storage dist")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
    },
  },
  'ali-oss': {
    properties: {
      region: {
        title: '{{t("region")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      accessKeyId: {
        title: '{{t("accessKeyId")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      accessKeySecret: {
        title: '{{t("accessKeySecret")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      bucket: {
        title: '{{t("bucket")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
    },
  },
  s3: {
    properties: {
      region: {
        title: '{{t("s3 region")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      accessKeyId: {
        title: '{{t("s3 accessKeyId")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      secretAccessKey: {
        title: '{{t("s3 secretAccessKey")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      bucket: {
        title: '{{t("s3 bucket")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
    },
  },
};

export const StorageOptions = observer((props) => {
  const form = useForm();
  const field = useField<Field>();
  const [s, setSchema] = useState(new Schema({}));
  useEffect(() => {
    form.clearFormGraph('options.*');
    setSchema(new Schema(schema[form.values.type] || {}));
  }, [form.values.type]);
  return (
    <div>
      <FormLayout layout={'vertical'}>
        <RecursionField key={form.values.type || 'local'} basePath={field.address} onlyRenderProperties schema={s} />
      </FormLayout>
    </div>
  );
});
