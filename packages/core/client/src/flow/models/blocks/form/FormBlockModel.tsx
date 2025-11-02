/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import type {
  FlowContext,
  PropertyMeta,
  PropertyMetaFactory,
  CollectionField,
  Collection,
} from '@nocobase/flow-engine';
import { AddSubModelButton, createRecordMetaFactory, escapeT, FlowSettingsButton } from '@nocobase/flow-engine';
import { Form, FormInstance } from 'antd';
import { omit } from 'lodash';
import React from 'react';
import { commonConditionHandler, ConditionBuilder } from '../../../components/ConditionBuilder';
import { BlockGridModel } from '../../base/BlockGridModel';
import { CollectionBlockModel } from '../../base/CollectionBlockModel';
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

  protected createFormValuesMetaFactory(): PropertyMetaFactory {
    const recordMeta: PropertyMetaFactory = createRecordMetaFactory(() => this.collection, 'Current form');
    const formValuesMeta: PropertyMetaFactory = async () => {
      const base = await recordMeta?.();
      const getActiveTopLevelFieldNames = (): Set<string> => {
        const items = this.subModels.grid?.subModels?.items ?? [];
        const names = new Set<string>();
        for (const it of items) {
          const fp = it?.getStepParams?.('fieldSettings', 'init')?.fieldPath;
          const top = fp.toString().split('.')[0];
          if (top) names.add(top);
        }
        return names;
      };
      const activeTopLevel = getActiveTopLevelFieldNames();
      const filterTopLevelProperties = async (meta: PropertyMeta): Promise<PropertyMeta> => {
        const clone = { ...meta };
        const propsResolved = typeof meta.properties === 'function' ? await meta.properties() : meta.properties;
        if (propsResolved && typeof propsResolved === 'object' && activeTopLevel.size > 0) {
          const filtered = {};
          for (const k of Object.keys(propsResolved)) {
            if (activeTopLevel.has(k)) filtered[k] = propsResolved[k];
          }
          clone.properties = filtered;
        } else {
          clone.properties = propsResolved;
        }
        return clone;
      };
      const filteredBase = base ? await filterTopLevelProperties(base) : base;
      return {
        ...(filteredBase || {
          type: 'object',
          title: this.translate('Current form'),
          properties: async () => ({}),
        }),
        // 根据表单中“已选中的关联字段值”构建 RecordRef 映射，用于 variables:resolve 的 contextParams
        buildVariablesParams: (ctx: FlowContext) => {
          const params: Record<string, any> = {};
          const formValues = ctx.formValues;

          const toId = (val: unknown, primaryKey: string) => {
            if (val == null) return undefined;
            if (typeof val === 'string' || typeof val === 'number') return val;
            if (typeof val === 'object') {
              return val[primaryKey];
            }
            return undefined;
          };

          // 遍历集合的顶层字段，收集关联字段
          const fields = (this.collection.getFields?.() ?? []) as CollectionField[];
          for (const field of fields) {
            const name = field?.name;
            if (!name || !field.target) continue;

            const associationValue = formValues[name];
            if (associationValue == null) continue;

            if (!field?.targetCollection) continue;
            const primaryKey = field.targetCollection.filterTargetKey;

            if (Array.isArray(associationValue)) {
              const ids = associationValue.map((item) => toId(item, primaryKey)).filter((v) => v != null);
              if (ids.length) {
                params[name] = {
                  collection: field.target,
                  dataSourceKey: field.targetCollection.dataSourceKey,
                  filterByTk: ids,
                };
              }
            } else {
              const id = toId(associationValue, primaryKey);
              if (id != null) {
                params[name] = {
                  collection: field.target,
                  dataSourceKey: field.targetCollection.dataSourceKey,
                  filterByTk: id,
                };
              }
            }
          }

          return params;
        },
      };
    };
    formValuesMeta.title = this.translate('Current form');
    return formValuesMeta;
  }

  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [form] = Form.useForm();
    this.context.defineProperty('form', { get: () => form });
    // 增强：为 formValues 提供基于“已选关联值”的服务端解析锚点
    const formValuesMeta: PropertyMetaFactory = this.createFormValuesMetaFactory();

    this.context.defineProperty('formValues', {
      get: () => {
        return this.context.form.getFieldsValue();
      },
      cache: false,
      meta: formValuesMeta,
      resolveOnServer: (p: string) => {
        if (!p || !p.includes('.')) return false;
        const m = p.match(/^([^.[]+)/);
        const baseFieldName = m?.[1];
        if (!baseFieldName) return false;

        const collection = this.collection as Collection;
        let field: CollectionField | undefined = collection?.getField?.(baseFieldName);
        if (!field) {
          const fields = collection?.getFields?.() ?? [];
          field = fields.find((f) => f?.name === baseFieldName);
        }
        return !!field?.isAssociationField?.();
      },
    });
  }

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('record', {
      get: () => this.getCurrentRecord(),
      cache: false,
    });
    this.context.resource.on('saved', () => {
      this.dispatchEvent('formSubmitSuccess', {});
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
  layoutProps = {},
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
        model.emitter.emit('formValuesChange', { changedValues, allValues });
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
  formValuesChange: {
    title: escapeT('Form values change'),
    name: 'formValuesChange',
    uiSchema: {
      condition: {
        type: 'object',
        title: escapeT('Trigger condition'),
        'x-decorator': 'FormItem',
        'x-component': ConditionBuilder,
      },
    },
    handler: commonConditionHandler,
  },
});

/**
 * 兼容旧版本
 * @deprecated use FormBlockModel instead
 */
export class FormModel extends FormBlockModel {}

FormModel.define({
  hide: true,
});
