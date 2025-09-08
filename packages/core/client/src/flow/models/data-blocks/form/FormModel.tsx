/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// import { createForm, Form } from '@formily/core';
import { CollectionField } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Form } from 'antd';
import React from 'react';
import { CollectionBlockModel } from '../../base/BlockModel';
import { BlockGridModel } from '../../base/GridModel';
import { FormActionModel } from './FormActionModel';
import { FormFieldGridModel } from './FormFieldGridModel';

export class FormModel extends CollectionBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: FormFieldGridModel; actions?: FormActionModel[] };
}> {
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
  initialValues,
}: {
  model: any;
  children: React.ReactNode;
  layoutProps?: any;
  initialValues?: any;
}) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (!model.context.has('form')) {
      model.context.defineProperty('form', { get: () => form, cache: false });
    }
  }, [form, model]);

  return (
    <Form
      form={model.form}
      initialValues={model.context.record || initialValues}
      {...layoutProps}
      labelCol={{ style: { width: layoutProps?.labelWidth } }}
      onValuesChange={(changedValues, allValues) => {
        model.dispatchEvent('formValuesChange', { changedValues, allValues });
      }}
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
    linkageRules: {
      uiMode: {
        type: 'dialog',
        props: {
          width: 900,
        },
      },
      use: 'linkageRules',
      defaultParams: {
        supportedActions: ['setFieldProps', 'assignField', 'runjs'],
      },
    },
  },
});

FormModel.registerFlow({
  key: 'eventSettings',
  title: tval('Event settings'),
  steps: {
    linkageRules: {
      uiMode: {
        type: 'dialog',
        props: {
          width: 900,
        },
      },
      use: 'linkageRules',
      title: 'Field linkage rules',
      defaultParams: {
        supportedActions: ['setFieldProps', 'assignField', 'runjs'],
      },
    },
  },
});
