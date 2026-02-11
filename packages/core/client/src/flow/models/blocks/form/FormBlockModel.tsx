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
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { commonConditionHandler, ConditionBuilder } from '../../../components/ConditionBuilder';
import {
  markSaveStepParamsWithSubModels,
  saveStepParamsWithSubModelsIfNeeded,
} from '../../../internal/utils/saveStepParamsWithSubModels';
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
  formModelSettings: new Set(['layout', 'assignRules']),
  eventSettings: new Set(['linkageRules']),
};

function isGridDelegatedStep(flowKey: string, stepKey: string): boolean {
  return !!GRID_DELEGATED_STEP_KEYS[flowKey]?.has(stepKey);
}
export class FormBlockModel<
  T extends DefaultCollectionBlockModelStructure = DefaultCollectionBlockModelStructure,
> extends CollectionBlockModel<T> {
  formValueRuntime?: FormValueRuntime;

  private userModifiedTopLevelFields = new Set<string>();

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

  setFieldValue(fieldName: any, value: any) {
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
    return await saveStepParamsWithSubModelsIfNeeded(this, async () => {
      const res = await super.saveStepParams();
      const grid = this.subModels.grid;
      await grid?.saveStepParams();
      return res;
    });
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
      resolveOnServer: (subPath: string) => {
        // 约定：
        // - 已配置到表单网格的字段：优先使用前端表单值（仅关联字段子路径按需服务端补全）
        // - 未配置到表单网格但存在于 collection 的字段：编辑表单场景下可走服务端按 DB 值解析
        if (!subPath) return false;

        const getTopLevel = (p: string): string | undefined => {
          const m = String(p || '').match(/^([^.[]+)/);
          return m?.[1];
        };
        const top = getTopLevel(subPath);
        if (!top) return false;

        // 仅对存在于 collection 的字段生效（避免未知字段触发无意义的服务端解析）
        const field = this.collection?.getField?.(top);
        if (!field) return false;

        const getActiveTopLevelFieldNames = (): Set<string> => {
          const items = this.subModels.grid?.subModels?.items ?? [];
          const names = new Set<string>();
          for (const it of items) {
            const fp = it?.getStepParams?.('fieldSettings', 'init')?.fieldPath;
            const active = fp?.toString().split('.')[0];
            if (active) names.add(active);
          }
          return names;
        };
        const activeTopLevel = getActiveTopLevelFieldNames();
        const isConfiguredField = activeTopLevel.has(top);

        if (isConfiguredField) {
          // 编辑表单场景：若前端已将关联字段清空（但尚未提交到服务端），
          // 则不应回落到服务端按 DB 值解析（否则会把“旧关联值”解析回来）。
          const topValue = this.form?.getFieldValue?.(top);
          if (topValue == null) return false;
          if (Array.isArray(topValue) && topValue.length === 0) return false;
          // 已配置字段：仅关联字段的子路径按需服务端补全（保持现有语义）
          const assocResolver = createAssociationSubpathResolver(
            () => this.collection,
            () => runtime.getFormValuesSnapshot(),
          );
          return assocResolver(subPath);
        }

        // 未配置字段：仅在可推断当前记录锚点（filterByTk）时才允许服务端解析；
        // 新建表单无锚点时直接返回 false（最终取值为 undefined）。
        try {
          const tk =
            this.context?.resource?.getMeta?.('currentFilterByTk') ??
            this.context?.resource?.getFilterByTk?.() ??
            this.collection?.getFilterByTK?.(this.context?.record);
          if (typeof tk === 'undefined' || tk === null) return false;
        } catch (_) {
          return false;
        }

        return true;
      },
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
  [key: string]: any;
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
        model.markUserModifiedFields?.(changedValues);

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

type UseFormGridHeightOptions = {
  heightMode?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  actionsRef?: React.RefObject<HTMLDivElement>;
  footerRef?: React.RefObject<HTMLDivElement>;
  deps?: React.DependencyList;
};

const getOuterHeight = (element?: HTMLElement | null) => {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  return rect.height + marginTop + marginBottom;
};

const useFormGridHeight = ({
  heightMode,
  containerRef,
  actionsRef,
  footerRef,
  deps = [],
}: UseFormGridHeightOptions) => {
  const [gridHeight, setGridHeight] = useState<number>();

  const calcGridHeight = useCallback(() => {
    if (heightMode !== 'specifyValue' && heightMode !== 'fullHeight') {
      setGridHeight((prev) => (prev === undefined ? prev : undefined));
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const containerHeight = container.getBoundingClientRect().height;
    if (!containerHeight) return;
    const actionsHeight = getOuterHeight(actionsRef?.current || null);
    const footerHeight = getOuterHeight(footerRef?.current || null);
    const nextHeight = Math.max(0, Math.floor(containerHeight - actionsHeight - footerHeight));
    setGridHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [heightMode, containerRef, actionsRef, footerRef]);

  useLayoutEffect(() => {
    calcGridHeight();
  }, [calcGridHeight, ...deps]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const container = containerRef.current;
    const actions = actionsRef?.current || null;
    const footer = footerRef?.current || null;
    const observer = new ResizeObserver(() => calcGridHeight());
    observer.observe(container);
    if (actions) observer.observe(actions);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, [calcGridHeight, containerRef, actionsRef, footerRef, ...deps]);

  return gridHeight;
};

type FormBlockContentProps = {
  model: FormBlockModel;
  gridModel: FormGridModel;
  layoutProps?: any;
  onFinish?: (values: any) => void;
  grid: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  heightMode?: string;
  height?: number;
};

export const FormBlockContent = ({
  model,
  gridModel,
  layoutProps,
  onFinish,
  grid,
  actions,
  footer,
  heightMode,
  height,
}: FormBlockContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const isFixedHeight = heightMode === 'specifyValue' || heightMode === 'fullHeight';
  const gridHeight = useFormGridHeight({
    heightMode,
    containerRef,
    actionsRef: actions ? actionsRef : undefined,
    footerRef: footer ? footerRef : undefined,
    deps: [height],
  });

  useEffect(() => {
    if (!gridModel) return;
    const nextHeight = isFixedHeight ? gridHeight : undefined;
    if (gridModel.props?.height === nextHeight) return;
    gridModel.setProps({ height: nextHeight });
  }, [gridModel, gridHeight, isFixedHeight]);

  const formStyle = isFixedHeight
    ? {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
      }
    : undefined;

  const containerStyle: any = isFixedHeight
    ? {
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        flex: 1,
      }
    : undefined;

  return (
    <FormComponent model={model} layoutProps={layoutProps} onFinish={onFinish} style={formStyle}>
      <div ref={containerRef} style={containerStyle}>
        {grid}
        {actions ? (
          <div style={{ paddingTop: model.context?.themeToken?.padding }} ref={actionsRef}>
            {actions}
          </div>
        ) : null}
        {footer ? <div ref={footerRef}>{footer}</div> : null}
      </div>
    </FormComponent>
  );
};

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
      title: tExpr('Field values'),
      beforeParamsSave(ctx) {
        // 迁移：保存表单级规则后，移除字段级默认值配置（editItemSettings/formItemSettings.initialValue）
        // 字段级默认值会在 UI 打开时自动合并到本步骤表单值中，因此此处仅做清理即可。
        const cleared = clearLegacyDefaultValuesFromFormModel(ctx.model);
        if (Array.isArray(cleared) && cleared.length) {
          // FlowModelRepository({ onlyStepParams: true }) 不会写入 subModels，
          // 此处标记后在 saveStepParams 中触发一次全量保存以持久化清理结果。
          markSaveStepParamsWithSubModels(ctx.model);
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
        ctx.model.applyFlow('eventSettings', {
          changedValues: {},
          allValues: ctx.form?.getFieldsValue(true),
        });
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
