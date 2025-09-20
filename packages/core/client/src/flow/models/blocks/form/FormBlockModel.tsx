/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  AddSubModelButton,
  createCurrentRecordMetaFactory,
  createRecordMetaFactory,
  escapeT,
  FlowSettingsButton,
} from '@nocobase/flow-engine';
import { Form, FormInstance } from 'antd';
import { omit } from 'lodash';
import React from 'react';
import { BlockGridModel, CollectionBlockModel } from '../../base';
import { FormActionModel } from './FormActionModel';
import { FormGridModel } from './FormGridModel';

type DefaultCollectionBlockModelStructure = {
  parent?: BlockGridModel;
  subModels?: { grid: FormGridModel; actions?: FormActionModel[] };
};

type CustomFormBlockModelClassesEnum = {};
export class FormBlockModel<
  T extends DefaultCollectionBlockModelStructure = DefaultCollectionBlockModelStructure,
> extends CollectionBlockModel<T> {
  get form() {
    return this.context.form as FormInstance;
  }

  _defaultCustomModelClasses = {
    FormActionGroupModel: 'FormActionGroupModel',
    FormItemModel: 'FormItemModel',
    FormCustomItemModel: 'FormCustomItemModel',
  };

  customModelClasses: CustomFormBlockModelClassesEnum = {};

  renderConfigureActions() {
    return (
      <AddSubModelButton
        model={this}
        subModelKey="actions"
        subModelBaseClass={this.getModelClassName('FormActionGroupModel')}
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  setFieldsValue(values: any) {
    this.form.setFieldsValue(values);
  }

  setFieldValue(fieldName: string, value: any) {
    this.form.setFieldValue(fieldName, value);
  }

  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [form] = Form.useForm();
    this.context.defineProperty('form', { get: () => form });
    const recordMeta: PropertyMetaFactory = createRecordMetaFactory(() => this.collection, 'Current form');
    this.context.defineProperty('formValues', {
      get: () => {
        return this.context.form.getFieldsValue();
      },
      cache: false,
      meta: recordMeta,
    });
  }

  onInit(options) {
    super.onInit(options);

    const recordMeta: PropertyMetaFactory = createCurrentRecordMetaFactory(this.context, () => this.collection);
    this.context.defineProperty('record', {
      get: () => this.getCurrentRecord(),
      cache: false,
    });
  }

  onMount() {
    super.onMount();
    // 首次渲染触发一次事件流
    setTimeout(() => {
      this.applyFlow('eventSettings');
    }, 100); // TODO：待修复。不延迟的话，会导致 disabled 的状态不生效
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
  ...rest
}: {
  model: any;
  children: React.ReactNode;
  layoutProps?: any;
  initialValues?: any;
  onFinish?: (values: any) => void;
}) {
  return (
    <Form
      form={model.form}
      initialValues={model.context.record || initialValues}
      {...omit(layoutProps, 'labelWidth')}
      labelCol={{ style: { width: layoutProps?.labelWidth } }}
      onValuesChange={(changedValues, allValues) => {
        model.dispatchEvent('formValuesChange', { changedValues, allValues }, { debounce: true });
      }}
      {...rest}
    >
      {children}
    </Form>
  );
}

FormBlockModel.define({
  hide: true,
});

FormBlockModel.registerFlow({
  key: 'formModelSettings',
  title: escapeT('Form settings'),
  steps: {
    layout: {
      use: 'layout',
      title: escapeT('Layout'),
    },
  },
});

FormBlockModel.registerFlow({
  key: 'eventSettings',
  title: escapeT('Event settings'),
  on: 'formValuesChange',
  steps: {
    linkageRules: {
      use: 'fieldLinkageRules',
      afterParamsSave(ctx) {
        // 保存后，自动运行一次
        ctx.model.applyFlow('eventSettings');
      },
    },
  },
});

FormBlockModel.registerEvents({
  formValuesChange: { label: escapeT('Form values change'), name: 'formValuesChange' },
});

/**
 * 兼容旧版本
 * @deprecated use FormBlockModel instead
 */
export class FormModel extends FormBlockModel {}

FormModel.define({
  hide: true,
});
