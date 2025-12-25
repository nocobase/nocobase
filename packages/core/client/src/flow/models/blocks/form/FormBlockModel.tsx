/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import type { PropertyMeta, PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  AddSubModelButton,
  createAssociationAwareObjectMetaFactory,
  createAssociationSubpathResolver,
  FlowSettingsButton,
  tExpr,
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

const GRID_DELEGATED_STEP_KEYS: Record<string, Set<string>> = {
  formModelSettings: new Set(['layout']),
  eventSettings: new Set(['linkageRules']),
};

function isGridDelegatedStep(flowKey: string, stepKey: string): boolean {
  return !!GRID_DELEGATED_STEP_KEYS[flowKey]?.has(stepKey);
}
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

  public async onDispatchEventStart(eventName: string, options?: any, inputArgs?: Record<string, any>): Promise<void> {
    if (eventName === 'beforeRender') {
      const grid = this.subModels.grid;
      if (grid) {
        await grid.dispatchEvent('beforeRender', inputArgs, { useCache: options?.useCache });
      }
    }
    await super.onDispatchEventStart?.(eventName, options, inputArgs);
  }

  getStepParams(flowKey: string, stepKey: string): any | undefined;
  getStepParams(flowKey: string): Record<string, any> | undefined;
  getStepParams(): Record<string, any>;
  getStepParams(flowKey?: string, stepKey?: string): any {
    const grid = this.subModels.grid;

    if (flowKey && stepKey && isGridDelegatedStep(flowKey, stepKey) && grid) {
      const fromGrid = grid.getStepParams(flowKey, stepKey);
      if (typeof fromGrid !== 'undefined') {
        return fromGrid;
      }
      return super.getStepParams(flowKey, stepKey);
    }

    if (flowKey && !stepKey && GRID_DELEGATED_STEP_KEYS[flowKey] && grid) {
      const base = (super.getStepParams(flowKey) || {}) as Record<string, any>;
      const fromGrid = (grid.getStepParams(flowKey) || {}) as Record<string, any>;
      for (const k of GRID_DELEGATED_STEP_KEYS[flowKey]) {
        if (Object.prototype.hasOwnProperty.call(fromGrid, k) && typeof fromGrid[k] !== 'undefined') {
          base[k] = fromGrid[k];
        }
      }
      return base;
    }

    return super.getStepParams(flowKey, stepKey);
  }

  setStepParams(flowKey: string, stepKey: string, params: any): void;
  setStepParams(flowKey: string, stepParams: Record<string, any>): void;
  setStepParams(allParams: Record<string, any>): void;
  setStepParams(flowKeyOrAllParams: any, stepKeyOrStepsParams?: any, params?: any): void {
    const grid = this.subModels.grid;
    const emitChanged = () => this.emitter?.emit?.('onStepParamsChanged');

    if (typeof flowKeyOrAllParams === 'string') {
      const flowKey = flowKeyOrAllParams;
      if (typeof stepKeyOrStepsParams === 'string' && params !== undefined) {
        const stepKey = stepKeyOrStepsParams;
        if (isGridDelegatedStep(flowKey, stepKey) && grid) {
          grid.setStepParams(flowKey, stepKey, params);
          emitChanged();
          return;
        }
        super.setStepParams(flowKey, stepKey, params);
        return;
      }
      if (typeof stepKeyOrStepsParams === 'object' && stepKeyOrStepsParams !== null) {
        const stepsParams = stepKeyOrStepsParams as Record<string, any>;
        const delegatedKeys = GRID_DELEGATED_STEP_KEYS[flowKey];
        const localSteps: Record<string, any> = {};
        let didDelegate = false;
        for (const [k, v] of Object.entries(stepsParams)) {
          if (delegatedKeys?.has(k) && grid) {
            grid.setStepParams(flowKey, k, v);
            didDelegate = true;
          } else {
            localSteps[k] = v;
          }
        }
        if (Object.keys(localSteps).length > 0) {
          super.setStepParams(flowKey, localSteps);
          return;
        }
        if (didDelegate) {
          emitChanged();
        }
        return;
      }
    }

    if (typeof flowKeyOrAllParams === 'object' && flowKeyOrAllParams !== null) {
      const allParams = flowKeyOrAllParams as Record<string, any>;
      const localAll: Record<string, any> = {};
      let didDelegate = false;
      for (const [flowKey, steps] of Object.entries(allParams)) {
        if (!GRID_DELEGATED_STEP_KEYS[flowKey] || typeof steps !== 'object' || steps === null || !grid) {
          localAll[flowKey] = steps;
          continue;
        }
        const delegatedKeys = GRID_DELEGATED_STEP_KEYS[flowKey];
        const localSteps: Record<string, any> = {};
        for (const [k, v] of Object.entries(steps as Record<string, any>)) {
          if (delegatedKeys.has(k)) {
            grid.setStepParams(flowKey, k, v);
            didDelegate = true;
          } else {
            localSteps[k] = v;
          }
        }
        if (Object.keys(localSteps).length > 0) {
          localAll[flowKey] = localSteps;
        }
      }
      if (Object.keys(localAll).length > 0) {
        super.setStepParams(localAll);
        return;
      }
      if (didDelegate) {
        emitChanged();
      }
    }
  }

  async saveStepParams() {
    const res = await super.saveStepParams();
    const grid = this.subModels.grid;
    await grid?.saveStepParams();
    return res;
  }

  protected createFormValuesMetaFactory(): PropertyMetaFactory {
    // 基于通用函数创建 MetaFactory（含 buildVariablesParams）
    const baseFactory: PropertyMetaFactory = createAssociationAwareObjectMetaFactory(
      () => this.collection,
      this.translate('Current form'),
      () => this.form?.getFieldsValue?.() || {},
    );

    // UI 优化：仅显示当前表单网格中已启用的顶层字段
    const factory: PropertyMetaFactory = async () => {
      const base = (await baseFactory()) as PropertyMeta | null;
      if (!base) return null;

      const getActiveTopLevelFieldNames = (): Set<string> => {
        const items = this.subModels.grid?.subModels?.items ?? [];
        const names = new Set<string>();
        for (const it of items) {
          const fp = it?.getStepParams?.('fieldSettings', 'init')?.fieldPath;
          const top = fp?.toString().split('.')[0];
          if (top) names.add(top);
        }
        return names;
      };
      const activeTopLevel = getActiveTopLevelFieldNames();

      const propsResolved = typeof base.properties === 'function' ? await base.properties() : base.properties;
      const filteredBase: PropertyMeta = { ...base };
      if (propsResolved && activeTopLevel.size > 0) {
        const filtered: Record<string, PropertyMeta> = {};
        for (const k of Object.keys(propsResolved)) {
          if (activeTopLevel.has(k)) filtered[k] = propsResolved[k];
        }
        filteredBase.properties = filtered;
      } else {
        filteredBase.properties = propsResolved;
      }
      return filteredBase;
    };
    factory.title = this.translate('Current form');
    return factory;
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
      resolveOnServer: createAssociationSubpathResolver(
        () => this.collection,
        () => this.form.getFieldsValue(),
      ),
      serverOnlyWhenContextParams: true,
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
  title: tExpr('Form settings'),
  steps: {
    layout: {
      use: 'layout',
      title: tExpr('Layout'),
    },
  },
});

FormBlockModel.registerFlow({
  key: 'eventSettings',
  title: tExpr('Event settings'),
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
    title: tExpr('Form values change'),
    name: 'formValuesChange',
    uiSchema: {
      condition: {
        type: 'object',
        title: tExpr('Trigger condition'),
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
