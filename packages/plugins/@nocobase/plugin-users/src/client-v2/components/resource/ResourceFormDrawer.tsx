/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import { Form, type FormInstance, type FormProps } from 'antd';
import React, { useEffect, useState } from 'react';
import { DrawerFormLayout } from '@nocobase/client-v2';

export interface ResourceFormDrawerRenderArgs<Values extends object> {
  form: FormInstance<Values>;
  submitting: boolean;
}

export interface ResourceFormDrawerProps<Values extends object = Record<string, unknown>> {
  title: React.ReactNode;
  initialValues?: Partial<Values>;
  form?: FormInstance<Values>;
  formProps?: Omit<FormProps<Values>, 'form' | 'initialValues' | 'children'>;
  children: React.ReactNode | ((args: ResourceFormDrawerRenderArgs<Values>) => React.ReactNode);
  onSubmit: (values: Values, form: FormInstance<Values>) => Promise<void> | void;
  onSubmitted?: (values: Values) => Promise<void> | void;
  submitText?: React.ReactNode;
  cancelText?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Drawer-hosted antd form for settings CRUD pages. The caller owns the API
 * branch (create/update/etc.); this component only handles form lifecycle,
 * validation, loading state, and the shared drawer chrome.
 */
export function ResourceFormDrawer<Values extends object = Record<string, unknown>>(
  props: ResourceFormDrawerProps<Values>,
) {
  const [internalForm] = Form.useForm<Values>();
  const form = props.form ?? internalForm;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    form.resetFields();
    form.setFieldsValue((props.initialValues ?? {}) as Values);
  }, [form, props.initialValues]);

  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await props.onSubmit(values, form);
      await props.onSubmitted?.(values);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <DrawerFormLayout
      title={props.title}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={props.submitText}
      cancelText={props.cancelText}
      footer={props.footer}
    >
      <Form<Values> form={form} layout="vertical" {...props.formProps}>
        {typeof props.children === 'function' ? props.children({ form, submitting }) : props.children}
      </Form>
    </DrawerFormLayout>
  );
}

export default ResourceFormDrawer;
