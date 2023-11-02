import { FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { observer, RecursionField, Schema, useField, useForm } from '@formily/react';
import React, { useEffect, useState } from 'react';
import { NAMESPACE } from './locale';

const schema = {
  local: {
    properties: {
      documentRoot: {
        title: `{{t("Destination", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        default: 'storage/uploads',
      },
    },
  },
  'ali-oss': {
    properties: {
      region: {
        title: `{{t("Region", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      accessKeyId: {
        title: `{{t("AccessKey ID", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      accessKeySecret: {
        title: `{{t("AccessKey Secret", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Password',
        required: true,
      },
      bucket: {
        title: `{{t("Bucket", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      thumbnailRule: {
        title: 'Thumbnail rule',
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
    },
  },
  'tx-cos': {
    properties: {
      Region: {
        title: `{{t("Region", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      SecretId: {
        title: `{{t("SecretId", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      SecretKey: {
        title: `{{t("SecretKey", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Password',
        required: true,
      },
      Bucket: {
        title: `{{t("Bucket", { ns: "${NAMESPACE}" })}}`,
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
        title: `{{t("Region", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      accessKeyId: {
        title: `{{t("AccessKey ID", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      secretAccessKey: {
        title: `{{t("AccessKey Secret", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Password',
        required: true,
      },
      bucket: {
        title: `{{t("Bucket", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        required: true,
      },
      endpoint: {
        title: `{{t("Endpoint", { ns: "${NAMESPACE}" })}}`,
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
    },
  },
};

export const StorageOptions = observer(
  (props) => {
    const form = useForm();
    const field = useField<Field>();
    const [s, setSchema] = useState(new Schema({}));
    useEffect(() => {
      // form.clearFormGraph('options.*');
      setSchema(new Schema(schema[form.values.type] || {}));
    }, [form.values.type]);
    return (
      <FormLayout layout={'vertical'}>
        <RecursionField key={form.values.type || 'local'} basePath={field.address} onlyRenderProperties schema={s} />
      </FormLayout>
    );
  },
  { displayName: 'StorageOptions' },
);
