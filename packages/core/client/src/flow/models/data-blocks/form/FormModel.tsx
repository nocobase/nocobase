/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// import { createForm, Form } from '@formily/core';
import { Form } from 'antd';
import React from 'react';
import { tval } from '@nocobase/utils/client';
import { CollectionBlockModel } from '../../base/BlockModel';
import { BlockGridModel } from '../../base/GridModel';
import { FormActionModel } from './FormActionModel';
import { FormFieldGridModel } from './FormFieldGridModel';
import { CollectionField } from '@nocobase/flow-engine';

export class FormModel extends CollectionBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: FormFieldGridModel; actions?: FormActionModel[] };
}> {
  protected static override filterAssociatedFields(fields: CollectionField[]): CollectionField[] {
    const toMany = ['o2m', 'm2m'];
    return fields.filter((f: any) => toMany.includes(f.interface));
  }
  get form() {
    return this.context.form;
  }

  onInit(options) {
    super.onInit(options);

    this.context.defineProperty('record', {
      get: () => this.getCurrentRecord(),
      cache: false,
    });
  }

  getCurrentRecord() {
    return {};
  }

  renderComponent() {
    throw new Error('renderComponent method must be implemented in subclasses of FormModel');
  }
}

export function FormComponent({
  model,
  children,
  layoutProps = {} as any,
}: {
  model: any;
  children: React.ReactNode;
  layoutProps?: any;
}) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    model.context.defineProperty('form', { get: () => form });
  }, [form, model]);

  return (
    <Form
      key={model.uid}
      form={form}
      initialValues={model.context.record}
      {...layoutProps}
      labelCol={{ style: { width: layoutProps?.labelWidth } }}
    >
      {children}
    </Form>
  );
}

FormModel.define({
  hide: true,
});

FormModel.registerFlow({
  key: 'formModelSettings',
  title: tval('Form settings'),
  steps: {
    layout: {
      use: 'layout',
      title: tval('Layout'),
    },
  },
});
