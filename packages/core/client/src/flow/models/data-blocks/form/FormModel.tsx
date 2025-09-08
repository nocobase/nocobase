/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// import { createForm, Form } from '@formily/core';
import { CollectionField, inferRecordRef } from '@nocobase/flow-engine';
import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import { createCurrentRecordMetaFactory } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Form } from 'antd';
import React from 'react';
import { CollectionBlockModel } from '../../base/BlockModel';
import { BlockGridModel } from '../../base/GridModel';
import { FormActionModel } from './FormActionModel';
import { FormFieldGridModel } from './FormFieldGridModel';
import { buildRecordMeta } from '@nocobase/flow-engine';

type DefaultCollectionBlockModelStructure = {
  parent?: BlockGridModel;
  subModels?: { grid: FormFieldGridModel; actions?: FormActionModel[] };
};

export class FormModel<
  T extends DefaultCollectionBlockModelStructure = DefaultCollectionBlockModelStructure,
> extends CollectionBlockModel<T> {
  get form() {
    return this.context.form;
  }

  onInit(options) {
    super.onInit(options);

    const recordMeta: PropertyMetaFactory = createCurrentRecordMetaFactory(this.context, () => this.collection);
    this.context.defineProperty('record', {
      get: () => this.getCurrentRecord(),
      cache: false,
      resolveOnServer: true,
      meta: recordMeta,
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
  initialValues,
}: {
  model: any;
  children: React.ReactNode;
  layoutProps?: any;
  initialValues?: any;
}) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    model.context.defineProperty('form', { get: () => form });
  }, [form, model]);

  return (
    <Form
      key={model.uid}
      form={form}
      initialValues={model.context.record || initialValues}
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
