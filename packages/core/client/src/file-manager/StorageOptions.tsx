import { FormLayout } from '@formily/antd';
import { Field } from '@formily/core';
import { observer, RecursionField, Schema, useField, useForm } from '@formily/react';
import React, { useEffect, useState } from 'react';

const schema = {
  local: {
    properties: {
      dist: {
        title: '{{t("Destination")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
    },
  },
  'ali-oss': {
    properties: {
      region: {
        title: '{{t("Region")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      accessKeyId: {
        title: '{{t("AccessKey ID")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      accessKeySecret: {
        title: '{{t("AccessKey Secret")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      bucket: {
        title: '{{t("Bucket")}}',
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
        title: '{{t("Region")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      accessKeyId: {
        title: '{{t("AccessKey ID")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      secretAccessKey: {
        title: '{{t("AccessKey Secret")}}',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      bucket: {
        title: '{{t("Bucket")}}',
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
