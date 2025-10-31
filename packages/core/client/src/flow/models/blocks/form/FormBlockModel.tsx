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

  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [form] = Form.useForm();
    this.context.defineProperty('form', { get: () => form });
    const recordMeta: PropertyMetaFactory = createRecordMetaFactory(() => this.collection, 'Current form');
    // 增强：为 formValues 提供基于“已选关联值”的服务端解析锚点
    const formValuesMeta: PropertyMetaFactory = async () => {
      const base = await recordMeta?.();
      const self = this;
      return {
        ...(base || {
          type: 'object',
          title: this.translate('Current form') || 'Current form',
          properties: async () => ({}),
        }),
        // 根据表单中“已选中的关联字段值”构建 RecordRef 映射，用于 variables:resolve 的 contextParams
        buildVariablesParams: (ctx: FlowContext) => {
          const params: Record<string, any> = {};
          const collection = self.collection;
          const dataSourceKey = collection?.dataSourceKey || 'main';
          const formValues =
            (ctx as FlowContext & { formValues?: Record<string, unknown> }).formValues ||
            self.context.form?.getFieldsValue?.() ||
            {};

          if (!collection) {
            return params;
          }

          const ensureTarget = (field: CollectionField) => {
            // 优先使用字段上的 targetCollection；否则通过 dataSourceManager 获取
            const targetName = field?.target;
            if (!targetName) return null;
            const targetCollection: Collection | undefined =
              field?.targetCollection || self.context?.dataSourceManager?.getCollection?.(dataSourceKey, targetName);
            if (!targetCollection) {
              // 尽早暴露问题：字段声明了 target 但无法解析到目标集合
              // eslint-disable-next-line no-console
              console.warn('[FormBlockModel] Missing targetCollection for association field', {
                field: field?.name,
                targetName,
                dataSourceKey,
              });
            }
            return { targetName, targetCollection } as {
              targetName: string;
              targetCollection?: Collection & { getPrimaryKey?: () => string };
            } | null;
          };

          const toId = (val: unknown, primaryKey: string) => {
            if (val == null) return undefined;
            if (typeof val === 'string' || typeof val === 'number') return val;
            if (typeof val === 'object') {
              const obj = val as Record<string, unknown>;
              return obj?.[primaryKey] ?? obj?.id;
            }
            return undefined;
          };

          // 遍历集合的顶层字段，收集关联字段
          const fields = (collection.getFields?.() ?? []) as CollectionField[];
          for (const field of fields) {
            const name = field?.name;
            if (!name) continue;
            // 非关联字段跳过
            if (!field?.target) continue;

            const associationValue = (formValues as Record<string, unknown>)?.[name as string];
            if (associationValue == null) continue;

            const info = ensureTarget(field);
            if (!info?.targetCollection) continue;
            const primaryKey = info.targetCollection.getPrimaryKey() || 'id';

            if (Array.isArray(associationValue)) {
              const recordRefs = (associationValue as unknown[])
                .map((item) => {
                  const id = toId(item, primaryKey);
                  if (id == null) return null;
                  return { collection: info.targetName, dataSourceKey, filterByTk: id };
                })
                .filter(Boolean);
              if (recordRefs.length) params[name] = recordRefs;
            } else {
              const id = toId(associationValue, primaryKey);
              if (id != null) {
                params[name] = { collection: info.targetName, dataSourceKey, filterByTk: id };
              }
            }
          }

          return params;
        },
      } as PropertyMeta;
    };

    this.context.defineProperty('formValues', {
      get: () => {
        return this.context.form.getFieldsValue();
      },
      cache: false,
      meta: formValuesMeta,
      resolveOnServer: (p: string) => {
        if (!p || !p.includes('.')) return false;
        const m = p.match(/^([^.]+)/);
        const base = m?.[1];
        if (!base) return false;
        try {
          const collection: any = this.collection as any;
          let field: any = collection?.getField?.(base);
          if (!field) {
            const fields: any[] = collection?.getFields?.() ?? [];
            field = fields.find((f) => f?.name === base);
          }
          if (!field && this.context?.dataSourceManager?.getCollectionField) {
            const dataSourceKey = collection?.dataSourceKey;
            const colName = collection?.name;
            if (dataSourceKey && colName) {
              field = this.context.dataSourceManager.getCollectionField(`${dataSourceKey}.${colName}.${base}`);
            }
          }
          const isAssociation = !!(field?.target || field?.isAssociationField?.());
          return isAssociation;
        } catch (e) {
          return false;
        }
      },
    });
  }

  onInit(options) {
    super.onInit(options);

    const recordMeta: PropertyMetaFactory = createCurrentRecordMetaFactory(this.context, () => this.collection);
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
