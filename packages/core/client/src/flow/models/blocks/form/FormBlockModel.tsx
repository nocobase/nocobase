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
import { FormValueRuntime } from './value-runtime';
import { collectUpdateAssociationValuesFromAssignRules } from './assignRulesUpdateAssociationValues';
import { clearLegacyDefaultValuesFromFormModel } from './legacyDefaultValueMigration';

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
  formValueRuntime?: FormValueRuntime;

  get form() {
    return this.context.form as FormInstance;
  }

  _defaultCustomModelClasses = {
    FormActionGroupModel: 'FormActionGroupModel',
    FormItemModel: 'FormItemModel',
    FormAssociationFieldGroupModel: 'FormAssociationFieldGroupModel',
    // FormCustomItemModel: 'FormCustomItemModel',
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
    const ctx = this.context as any;
    if (typeof ctx.setFormValues === 'function') {
      void ctx.setFormValues(values, { source: 'system' }).catch((error: any) => {
        console.warn('[FormBlockModel] Failed to set form values via ctx.setFormValues', error);
      });
      return;
    }
    this.form.setFieldsValue(values);
  }

  setFieldValue(fieldName: string, value: any) {
    const ctx = this.context as any;
    if (typeof ctx.setFormValue === 'function') {
      void ctx.setFormValue(fieldName, value, { source: 'system' }).catch((error: any) => {
        console.warn('[FormBlockModel] Failed to set form value via ctx.setFormValue', error);
      });
      return;
    }
    this.form.setFieldValue(fieldName, value);
  }

  /**
   * @internal
   *
   * 仅用于编辑表单刷新保护：只记录「用户交互」触发的改动（来自 antd Form.onValuesChange）。
   * 程序化 setFieldValue/setFieldsValue 不会触发 onValuesChange（见 linkageRules 的手动 emit），因此不会污染该集合。
   */
  markUserModifiedFields(changedValues): void {
    if (!changedValues || typeof changedValues !== 'object') return;
    if (Array.isArray(changedValues)) return;
    for (const k of Object.keys(changedValues)) {
      if (k) this.userModifiedTopLevelFields.add(k);
    }
  }

  /**
   * @internal
   */
  getUserModifiedFields(): Set<string> {
    return this.userModifiedTopLevelFields;
  }

  /**
   * @internal
   */
  resetUserModifiedFields(): void {
    this.userModifiedTopLevelFields.clear();
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

    // 分离单个 flow 的 steps：委托部分直接写入 grid，返回本地部分
    const splitFlowSteps = (flowKey: string, stepsParams: Record<string, any>): Record<string, any> => {
      const delegatedKeys = GRID_DELEGATED_STEP_KEYS[flowKey];
      if (!delegatedKeys || !grid) return stepsParams;
      const localSteps: Record<string, any> = {};
      for (const [k, v] of Object.entries(stepsParams)) {
        if (delegatedKeys.has(k)) {
          grid.setStepParams(flowKey, k, v);
        } else {
          localSteps[k] = v;
        }
      }
      return localSteps;
    };

    // 形式1: (flowKey, stepKey, params)
    if (typeof flowKeyOrAllParams === 'string' && typeof stepKeyOrStepsParams === 'string' && params !== undefined) {
      if (isGridDelegatedStep(flowKeyOrAllParams, stepKeyOrStepsParams) && grid) {
        grid.setStepParams(flowKeyOrAllParams, stepKeyOrStepsParams, params);
      } else {
        super.setStepParams(flowKeyOrAllParams, stepKeyOrStepsParams, params);
      }
      return;
    }

    // 形式2: (flowKey, stepsParams)
    if (
      typeof flowKeyOrAllParams === 'string' &&
      typeof stepKeyOrStepsParams === 'object' &&
      stepKeyOrStepsParams !== null
    ) {
      const localSteps = splitFlowSteps(flowKeyOrAllParams, stepKeyOrStepsParams);
      if (Object.keys(localSteps).length > 0) {
        super.setStepParams(flowKeyOrAllParams, localSteps);
      }
      return;
    }

    // 形式3: (allParams)
    if (typeof flowKeyOrAllParams === 'object' && flowKeyOrAllParams !== null) {
      const localAll: Record<string, any> = {};
      for (const [flowKey, steps] of Object.entries(flowKeyOrAllParams)) {
        if (typeof steps !== 'object' || steps === null) {
          localAll[flowKey] = steps;
          continue;
        }
        const localSteps = splitFlowSteps(flowKey, steps as Record<string, any>);
        if (Object.keys(localSteps).length > 0) {
          localAll[flowKey] = localSteps;
        }
      }
      if (Object.keys(localAll).length > 0) {
        super.setStepParams(localAll);
      }
    }
  }

  async saveStepParams() {
    const shouldSaveSubModels = (this as any).__saveStepParamsWithSubModels === true;
    if (shouldSaveSubModels) {
      try {
        // full save (including subModels) to persist migrated field-level settings cleanup
        return await this.save();
      } finally {
        delete (this as any).__saveStepParamsWithSubModels;
      }
    }

    const res = await super.saveStepParams();
    const grid = this.subModels.grid;
    await grid?.saveStepParams();
    return res;
  }

  protected createFormValuesMetaFactory(): PropertyMetaFactory {
    // 基于通用函数创建 MetaFactory（含 buildVariablesParams）
    return createAssociationAwareObjectMetaFactory(
      () => this.collection,
      this.translate('Current form'),
      () => this.form?.getFieldsValue?.() || {},
    );
  }

  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [form] = Form.useForm();
    this.context.defineProperty('form', { get: () => form });

    if (!this.formValueRuntime) {
      this.formValueRuntime = new FormValueRuntime({
        model: this,
        getForm: () => this.context.form,
      });
    }
    const runtime = this.formValueRuntime;
    runtime.mount();
    // 增强：为 formValues 提供基于“已选关联值”的服务端解析锚点
    const formValuesMeta: PropertyMetaFactory = this.createFormValuesMetaFactory();

    this.context.defineProperty('formValues', {
      get: () => {
        return runtime.formValues;
      },
      cache: false,
      meta: formValuesMeta,
      resolveOnServer: createAssociationSubpathResolver(
        () => this.collection,
        () => runtime.getFormValuesSnapshot(),
      ),
      serverOnlyWhenContextParams: true,
    });

    this.context.defineMethod('getFormValues', function () {
      return runtime.getFormValuesSnapshot();
    });

    this.context.defineMethod('setFormValues', function (patch, options) {
      return runtime.setFormValues(this, patch, options);
    });

    this.context.defineMethod('setFormValue', function (path, value, options) {
      return runtime.setFormValues(this, [{ path, value }], options);
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

  protected onMount() {
    super.onMount();
    this.formValueRuntime?.mount({ sync: true });
    // 将"表单赋值"配置编译为运行时规则
    const params = this.getStepParams('formModelSettings', 'assignRules');
    const items = (params?.value || []) as any[];
    this.formValueRuntime?.syncAssignRules?.(Array.isArray(items) ? (items as any) : []);

    // 若规则目标包含关联字段的嵌套属性（如 user.name），自动补全 updateAssociationValues 以启用后端 nested update
    const resource: any = (this.context as any)?.resource;
    const updateAssociationValues = collectUpdateAssociationValuesFromAssignRules(items, this.collection);
    if (resource?.addUpdateAssociationValues && updateAssociationValues.length) {
      resource.addUpdateAssociationValues(updateAssociationValues);
    }
    // 首次渲染触发一次事件流
    setTimeout(() => {
      this.applyFlow('eventSettings');
    }, 100); // TODO：待修复。不延迟的话，会导致 disabled 的状态不生效
  }

  onUnmount() {
    this.formValueRuntime?.dispose();
    this.formValueRuntime = undefined;
    super.onUnmount();
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
      initialValues={model.context?.view?.inputArgs?.formData || model.context.record || initialValues}
      {...omit(layoutProps, 'labelWidth')}
      labelCol={{ style: { width: layoutProps?.labelWidth } }}
      onFieldsChange={(changedFields) => {
        const runtime = model.formValueRuntime;
        if (runtime) {
          runtime.handleFormFieldsChange(changedFields as any);
        }
      }}
      onValuesChange={(changedValues, allValues) => {
        const runtime = model.formValueRuntime;
        if (runtime) {
          runtime.handleFormValuesChange(changedValues, allValues);
          return;
        }
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
    assignRules: {
      use: 'formAssignRules',
      title: tExpr('Assign field values'),
      beforeParamsSave(ctx) {
        // 迁移：保存表单级规则后，移除字段级默认值配置（editItemSettings/formItemSettings.initialValue）
        // 字段级默认值会在 UI 打开时自动合并到本步骤表单值中，因此此处仅做清理即可。
        const cleared = clearLegacyDefaultValuesFromFormModel(ctx.model);
        if (Array.isArray(cleared) && cleared.length) {
          // FlowModelRepository({ onlyStepParams: true }) 不会写入 subModels，
          // 此处标记后在 saveStepParams 中触发一次全量保存以持久化清理结果。
          (ctx.model as any).__saveStepParamsWithSubModels = true;
        }
      },
      afterParamsSave(ctx) {
        // 保存后同步到运行时（若存在），以便立即生效
        const params = ctx.model.getStepParams('formModelSettings', 'assignRules');
        const items = (params?.value || []) as any[];
        (ctx.model as any)?.formValueRuntime?.syncAssignRules?.(Array.isArray(items) ? (items as any) : []);

        // 保存后同步补全 updateAssociationValues（避免 nested 字段在后端被 sanitize 掉）
        const resource: any = (ctx.model as any)?.context?.resource;
        const updateAssociationValues = collectUpdateAssociationValuesFromAssignRules(
          items,
          (ctx.model as any)?.collection,
        );
        if (resource?.addUpdateAssociationValues && updateAssociationValues.length) {
          resource.addUpdateAssociationValues(updateAssociationValues);
        }
      },
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
