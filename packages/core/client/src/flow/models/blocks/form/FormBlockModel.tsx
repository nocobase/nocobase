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
      // 仅收集“已配置进表单”的顶层字段（FormGridModel.items 中的 FormItemModel.fieldPath 的第一段）
      const getActiveTopLevelFieldNames = (): Set<string> => {
        try {
          const grid: any = (self.subModels as any)?.grid;
          const items: any[] = grid?.subModels?.items || [];
          const names = new Set<string>();
          items.forEach((item) => {
            const fp: string = item?.getStepParams?.('fieldSettings', 'init')?.fieldPath;
            if (!fp || typeof fp !== 'string') return;
            const top = fp.split('.')[0];
            if (top) names.add(top);
          });
          return names;
        } catch (_) {
          return new Set<string>();
        }
      };
      const activeTopLevel = getActiveTopLevelFieldNames();
      const filterTopLevelProperties = async (meta: PropertyMeta): Promise<PropertyMeta> => {
        try {
          const clone: PropertyMeta = { ...meta };
          const props = typeof meta.properties === 'function' ? await meta.properties() : meta.properties;
          if (props && typeof props === 'object' && activeTopLevel.size > 0) {
            const filtered: Record<string, any> = {};
            Object.keys(props).forEach((k) => {
              if (activeTopLevel.has(k)) filtered[k] = props[k];
            });
            clone.properties = filtered;
          } else {
            clone.properties = props;
          }
          return clone;
        } catch (_) {
          return meta;
        }
      };
      const filteredBase = base ? await filterTopLevelProperties(base) : base;
      return {
        ...(filteredBase || {
          type: 'object',
          title: this.translate('Current form') || 'Current form',
          properties: async () => ({}),
        }),
        // 根据表单中“已选中的关联字段值”构建 RecordRef 映射，用于 variables:resolve 的 contextParams
        buildVariablesParams: (ctx: FlowContext) => {
          const params: Record<string, any> = {};
          // 优先使用运行时上下文中的 blockModel（右侧配置面板解析时可引用到左侧实际表单块）
          const owner: any = (ctx as any).blockModel || self;
          const collection = owner?.collection || self.collection;
          const dataSourceKey = collection?.dataSourceKey || 'main';
          const formValues =
            (ctx as any)?.formValues ||
            owner?.context?.form?.getFieldsValue?.() ||
            self?.context?.form?.getFieldsValue?.() ||
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
            return { targetName, targetCollection };
          };

          const toId = (val: unknown, primaryKey: string, fieldName?: string, targetName?: string) => {
            if (val == null) return undefined;
            if (typeof val === 'string' || typeof val === 'number') return val;
            if (typeof val === 'object') {
              const obj = val as Record<string, unknown>;
              // 常见几种形态：{ [pk]: 1 }, { id: 1 }, { value: 1 }, { key: 1 }, { code: 1 }, { name: 1 }
              const got =
                obj?.[primaryKey] ??
                obj?.id ??
                (obj as any)?.value ??
                (obj as any)?.key ??
                (obj as any)?.code ??
                (obj as any)?.name;
              return got as any;
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
                .map((item) => toId(item, primaryKey, name as string, info.targetName))
                .filter((v) => v != null);
              if (ids.length) {
                params[name] = { collection: info.targetName, dataSourceKey, filterByTk: ids };
              }
            } else {
              const id = toId(associationValue, primaryKey, name as string, info.targetName);
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
        const m = p.match(/^([^.[]+)/);
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
