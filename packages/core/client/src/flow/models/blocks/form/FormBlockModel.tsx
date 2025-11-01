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
      // 仅收集“已配置进表单”的顶层字段（FormGridModel.items 中的 FormItemModel.fieldPath 的第一段）
      const getActiveTopLevelFieldNames = (): Set<string> => {
        const grid = (this.subModels as DefaultCollectionBlockModelStructure['subModels'] | undefined)?.grid;
        const items = (grid?.subModels as { items?: unknown[] } | undefined)?.items ?? [];
        const names = new Set<string>();
        for (const it of items as Array<{ getStepParams?: (...args: any[]) => any }>) {
          const fp = it?.getStepParams?.('fieldSettings', 'init')?.fieldPath as unknown;
          if (typeof fp !== 'string' || fp.length === 0) continue;
          const top = fp.split('.')[0];
          if (top) names.add(top);
        }
        return names;
      };
      const activeTopLevel = getActiveTopLevelFieldNames();
      const filterTopLevelProperties = async (meta: PropertyMeta): Promise<PropertyMeta> => {
        const clone: PropertyMeta = { ...meta };
        const propsResolved = typeof meta.properties === 'function' ? await meta.properties() : meta.properties;
        if (propsResolved && typeof propsResolved === 'object' && activeTopLevel.size > 0) {
          const filtered: Record<string, PropertyMeta> = {};
          for (const k of Object.keys(propsResolved as Record<string, PropertyMeta>)) {
            if (activeTopLevel.has(k)) filtered[k] = (propsResolved as Record<string, PropertyMeta>)[k];
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
          // 优先使用运行时上下文中的 blockModel（右侧配置面板解析时可引用到左侧实际表单块）
          const ownerModel = (ctx as FlowContext & { blockModel?: FormBlockModel }).blockModel ?? this;
          const collection = (ownerModel?.collection ?? this.collection) as Collection;
          const dataSourceKey = collection?.dataSourceKey ?? 'main';
          const formValues =
            // 优先使用 ctx.formValues（若存在）
            (ctx as unknown as { formValues?: unknown })?.formValues ??
            ownerModel?.context?.form?.getFieldsValue?.() ??
            this?.context?.form?.getFieldsValue?.() ??
            {};

          if (!collection) {
            return params;
          }

          const ensureTarget = (field: CollectionField) => {
            // 优先使用字段上的 targetCollection；否则通过 dataSourceManager 获取
            const targetName = field?.target;
            if (!targetName) return null;
            const targetCollection: Collection | undefined =
              field?.targetCollection ?? this.context?.dataSourceManager?.getCollection?.(dataSourceKey, targetName);
            return targetCollection ? { targetName, targetCollection } : null;
          };

          const toId = (val: unknown, primaryKey: string) => {
            if (val == null) return undefined;
            if (typeof val === 'string' || typeof val === 'number') return val;
            if (typeof val === 'object') {
              const obj = val as Record<string, unknown>;
              const got = (obj as Record<string, unknown>)[primaryKey] ?? (obj as Record<string, unknown>).id;
              return typeof got === 'string' || typeof got === 'number' ? got : undefined;
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
            const primaryKey = info.targetCollection.filterTargetKey || 'id';

            if (Array.isArray(associationValue)) {
              const ids = (associationValue as unknown[])
                .map((item) => toId(item, primaryKey))
                .filter((v) => v != null);
              if (ids.length) {
                params[name] = { collection: info.targetName, dataSourceKey, filterByTk: ids };
              }
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
        if (!field && this.context?.dataSourceManager?.getCollectionField) {
          const dataSourceKey = collection?.dataSourceKey;
          const colName = collection?.name;
          if (dataSourceKey && colName) {
            field = this.context.dataSourceManager.getCollectionField(
              `${dataSourceKey}.${colName}.${baseFieldName}`,
            ) as CollectionField | undefined;
          }
        }
        return !!(field?.isAssociationField?.() || (field as unknown as { target?: string })?.target);
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
