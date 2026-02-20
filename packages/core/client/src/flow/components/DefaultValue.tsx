/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect } from '@formily/react';
import { uid } from '@formily/shared';
import {
  FlowModelRenderer,
  MetaTreeNode,
  VariableInput,
  VariableTag,
  isVariableExpression,
  parseValueToPath,
  isRunJSValue,
  normalizeRunJSValue,
  runjsWithSafeGlobals,
  useFlowContext,
  extractPropertyPath,
  FlowModel,
  EditableItemModel,
} from '@nocobase/flow-engine';
import { get as lodashGet, set as lodashSet, isEqual } from 'lodash';
import React, { useMemo } from 'react';
import { Input } from 'antd';
import { FieldModel } from '../models';
import { RecordSelectFieldModel } from '../models/fields/AssociationFieldModel';
import { InputFieldModel } from '../models/fields/InputFieldModel';
import { ensureOptionsFromUiSchemaEnumIfAbsent } from '../internal/utils/enumOptionsUtils';
import { resolveOperatorComponent } from '../internal/utils/operatorSchemaHelper';
import { RunJSValueEditor } from './RunJSValueEditor';
import { buildDynamicNamePath } from '../models/blocks/form/dynamicNamePath';

interface Props {
  value: any;
  onChange: (value: any) => void;
  metaTree: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
  model: FieldModel;
  flags?: Record<string, any>;
}

const snapshotOptions = (input: any): any[] | undefined => {
  if (!input) return undefined;
  let normalized: any[] | undefined;
  if (Array.isArray(input)) {
    normalized = input;
  } else if (typeof input === 'object' && typeof input?.[Symbol.iterator] === 'function') {
    try {
      normalized = Array.from(input as Iterable<any>);
    } catch (error) {
      normalized = undefined;
    }
  } else if (typeof input === 'object') {
    const numericKeys = Object.keys(input)
      .filter((key) => /^\d+$/.test(key))
      .sort((a, b) => Number(a) - Number(b));
    if (numericKeys.length) {
      normalized = numericKeys.map((key) => input[key]);
    }
  }
  if (!normalized?.length) return undefined;
  return normalized.map((item) => (item && typeof item === 'object' ? { ...item } : item));
};

function createTempFieldClass(Base: any) {
  return class Temp extends Base {
    async onDispatchEventStart(eventName: string) {
      if (eventName !== 'beforeRender') return;
      const initParams = this.getStepParams?.('fieldSettings', 'init') || {};
      const collectionFieldKey =
        initParams?.dataSourceKey &&
        initParams?.collectionName &&
        initParams?.fieldPath &&
        `${initParams.dataSourceKey}.${initParams.collectionName}.${initParams.fieldPath}`;
      const collectionFieldFromManager =
        collectionFieldKey && this.context?.dataSourceManager?.getCollectionField?.(collectionFieldKey);
      const fallbackCollectionField = this._originalModel?.collectionField || this._fallbackCollectionField;
      if (collectionFieldFromManager || fallbackCollectionField)
        this.context.defineProperty('collectionField', {
          get: () => collectionFieldFromManager || fallbackCollectionField,
        });
    }
    async onDispatchEventEnd(eventName: string) {
      if (eventName !== 'beforeRender') return;
      const originalProps = {
        ...(this._originalPropsFallback || {}),
        ...(this._originalModel?.props || {}),
      };
      const collectionField = this.context?.collectionField;
      const nextProps: Record<string, any> = {};
      if (originalProps?.fieldNames) {
        nextProps.fieldNames = originalProps.fieldNames;
      }
      if (typeof originalProps?.allowMultiple !== 'undefined') {
        nextProps.allowMultiple = originalProps.allowMultiple;
      }
      const currentOptions = snapshotOptions(this.props?.options);
      const hasCurrentOptions = !!currentOptions?.length;
      const originalOptions = snapshotOptions(originalProps?.options);
      const fallbackOptions = originalOptions?.length ? originalOptions : this._originalOptionsFallback;
      if (!hasCurrentOptions && Array.isArray(fallbackOptions) && fallbackOptions.length > 0) {
        nextProps.options = fallbackOptions.map((item) => (item && typeof item === 'object' ? { ...item } : item));
      }
      const inferMultipleFromCollectionField = () => {
        const relationType = collectionField?.type;
        const relationInterface = collectionField?.interface;
        const byType =
          relationType &&
          (relationType === 'belongsToMany' || relationType === 'hasMany' || relationType === 'belongsToArray');
        const byInterface =
          relationInterface &&
          (relationInterface === 'm2m' || relationInterface === 'o2m' || relationInterface === 'mbm');
        return !!(byType || byInterface);
      };
      const inferredMultiple = inferMultipleFromCollectionField();
      const multiple = typeof originalProps.multiple !== 'undefined' ? originalProps.multiple : inferredMultiple;
      const allowMultiple =
        typeof originalProps.allowMultiple !== 'undefined'
          ? originalProps.allowMultiple
          : typeof originalProps.multiple !== 'undefined'
            ? originalProps.multiple
            : inferredMultiple;
      if (typeof multiple !== 'undefined') {
        nextProps.multiple = multiple;
      }
      if (typeof allowMultiple !== 'undefined') {
        nextProps.allowMultiple = allowMultiple;
      }
      if (Object.keys(nextProps).length) {
        this.setProps(nextProps);
      }

      // multipleSelect 接口的字段需要显式开启 antd Select 的多选模式
      // 仅当未显式传入 mode 时设置，避免覆盖外部自定义
      if (collectionField?.interface === 'multipleSelect' && typeof (this.props as any)?.mode === 'undefined') {
        this.setProps({ mode: 'multiple' });
      }

      // 为本地枚举型字段补全可选项（仅在未显式传入 options 时处理）
      ensureOptionsFromUiSchemaEnumIfAbsent(this as unknown as FlowModel, collectionField);

      this.showTitle?.(null);
      this.setDescription?.(null);
      this.setPattern?.('editable');
      if (this.props.onChange) this.setProps({ onChange: this.props.onChange });
      const initialValueFromStep = this.getStepParams('formItemSettings', 'initialValue')?.defaultValue;
      // 使用 defaultValue 避免受控，防止输入法（中文等）被频繁受控值覆盖
      if (typeof initialValueFromStep !== 'undefined') this.setProps({ defaultValue: initialValueFromStep });
    }

    setProps(props: any) {
      const {
        originalModel,
        // 强制与原字段解耦：忽略外部传入的只读/禁用相关属性
        disabled,
        readOnly,
        readPretty,
        pattern,
        ...filteredProps
      } = props || {};
      const ret = super.setProps?.({ ...filteredProps, disabled: false });
      // 始终保持可编辑
      this.setPattern?.('editable');
      return ret;
    }

    remove(...args: any[]) {
      super.remove?.(...args);
    }
  };
}

export const DefaultValue = connect((props: Props) => {
  const { value, onChange, metaTree: propMetaTree, flags: componentFlags, ...restProps } = props;
  const flowContext = useFlowContext();
  const { model } = flowContext;
  // no side-effects to original form until confirmed

  // 区分表单实现
  const isFormilyForm = React.useCallback((form: any) => {
    return !!form && typeof form?.query === 'function';
  }, []);

  // 安全判断：字段是否被用户实际修改
  const isUserModified = React.useCallback(
    (form: any, namePath: (string | number)[]) => {
      if (isFormilyForm(form)) {
        const selfModified = form.query(namePath)?.get?.('selfModified');
        const modified = form.query(namePath)?.get?.('modified');
        return !!(selfModified || modified);
      }
      if (typeof form?.isFieldsTouched === 'function') {
        return !!form.isFieldsTouched([namePath]);
      }
      return false;
    },
    [isFormilyForm],
  );

  // 读取当前值（兼容 Formily / AntD）
  const getFormValue = React.useCallback(
    (form: any, namePath: (string | number)[]) => {
      if (isFormilyForm(form)) return lodashGet(form.values, namePath);
      if (typeof form?.getFieldValue === 'function') return form.getFieldValue(namePath as any);
      const all = typeof form?.getFieldsValue === 'function' ? form.getFieldsValue(true) : undefined;
      return lodashGet(all, namePath);
    },
    [isFormilyForm],
  );

  // 写回（兼容 Formily / AntD）
  const setFormValue = React.useCallback(
    (form: any, namePath: (string | number)[], val: any) => {
      if (!form || !namePath?.length) return;
      if (isFormilyForm(form)) {
        form.setFieldValue(namePath, val);
        return;
      }
      if (typeof form?.setFieldValue === 'function') {
        // AntD v5 支持 setFieldValue
        form.setFieldValue(namePath as any, val);
      } else {
        const payload: any = {};
        lodashSet(payload, namePath, val);
        form?.setFieldsValue?.(payload);
      }
    },
    [isFormilyForm],
  );

  // 解析变量表达式
  const resolveMaybeVariable = React.useCallback(
    async (rawVal: any) => {
      let out = rawVal;
      // RunJS default: execute and use the computed result for preview/backfill
      if (isRunJSValue(out)) {
        try {
          const { code, version } = normalizeRunJSValue(out);
          const ret = await runjsWithSafeGlobals(model?.context, code, { version });
          out = ret?.success ? ret.value : undefined;
        } catch {
          out = undefined;
        }
        return out;
      }
      if (isVariableExpression(out)) {
        const resolved = await model?.context?.resolveJsonTemplate?.(out);
        if (typeof resolved !== 'undefined') out = resolved;
        if (out === rawVal) {
          const p = extractPropertyPath(String(out));
          if (p) out = lodashGet(model?.context as any, p.join('.'));
        }
      }
      return out;
    },
    [model],
  );

  // 构建动态 NamePath（兼容数组子表单的行索引）
  const buildDynamicName = React.useCallback(
    (nameParts: (string | number)[], fieldIndex?: string[]): (string | number)[] => {
      return buildDynamicNamePath(nameParts, fieldIndex);
    },
    [],
  );

  // 在“确定”时机拦截：覆盖 setStepParams，保存当前步参数后进行必要的表单回填
  React.useEffect(() => {
    const host: any = model;
    if (!host || host.__dvSetStepParamsPatched) return;
    const original = host.setStepParams?.bind(host);
    if (typeof original !== 'function') return;
    host.__dvSetStepParamsPatched = true;
    host.setStepParams = async (flowKeyOrAll: any, stepKeyOrSteps?: any, params?: any) => {
      // 捕获保存前的上一次默认值（仅处理 (flowKey, stepKey, params) 这种签名）
      let prevDefault: any = undefined;
      let nextDefault: any = undefined;
      let namePath: (string | number)[] = [];
      const rawName: any = host?.props?.name ?? host?.fieldPath;
      const basePath: (string | number)[] = Array.isArray(rawName)
        ? rawName
        : typeof rawName === 'string'
          ? rawName.split('.')
          : [rawName].filter(Boolean);
      namePath = buildDynamicName(basePath, host?.context?.fieldIndex);
      if (
        typeof flowKeyOrAll === 'string' &&
        typeof stepKeyOrSteps === 'string' &&
        params &&
        params.defaultValue !== undefined
      ) {
        prevDefault = host.getStepParams(flowKeyOrAll, stepKeyOrSteps)?.defaultValue;
        nextDefault = params.defaultValue;
      }

      // 调用原方法，先持久化 step 参数
      const result = original(flowKeyOrAll, stepKeyOrSteps, params);

      // 如果命中默认值修改，则尝试写回原表单
      if (nextDefault !== undefined) {
        const form: any = host?.context?.blockModel?.context?.form || host?.context?.form;
        if (form && namePath.length) {
          const modified = isUserModified(form, namePath);
          const current = getFormValue(form, namePath);
          const prevResolved = await resolveMaybeVariable(prevDefault);
          const nextResolved = await resolveMaybeVariable(nextDefault);
          const isEmpty = current === undefined || current === null || current === '';
          const safeToOverwrite = isEqual(current, prevResolved) || (!modified && isEmpty);

          if (typeof nextResolved !== 'undefined' && safeToOverwrite) {
            setFormValue(form, namePath, nextResolved);
          }
        }
      }

      return result;
    };
  }, [model, getFormValue, isUserModified, resolveMaybeVariable, setFormValue, buildDynamicName]);

  const mergedFlags = useMemo(() => {
    const baseFlags = model?.context?.flags;
    if (!baseFlags && !componentFlags) {
      return undefined;
    }
    return { ...(baseFlags || {}), ...(componentFlags || {}) };
  }, [model, componentFlags]);
  // 外层经常传入新的 flags 对象引用（内容不变），这里做深比较稳定引用，避免临时模型被误重建
  const stableMergedFlagsRef = React.useRef<Record<string, any> | undefined>(undefined);
  if (!isEqual(stableMergedFlagsRef.current, mergedFlags)) {
    stableMergedFlagsRef.current = mergedFlags;
  }
  const stableMergedFlags = stableMergedFlagsRef.current;

  // Build a temporary field model (isolated), using collectionField's recommended editable subclass
  const tempRoot = useMemo(() => {
    const host = model;
    const origin = host?.customFieldModelInstance || host?.subModels?.field;
    const originProps = (origin?.props || {}) as Record<string, any>;
    const hostCustomFieldProps = (host?.customFieldProps || {}) as Record<string, any>;
    const { value: _originValue, defaultValue: _originDefaultValue, ...originPropsWithoutValue } = originProps;
    const {
      value: _customValue,
      defaultValue: _customDefaultValue,
      ...hostCustomFieldPropsWithoutValue
    } = hostCustomFieldProps;
    const init = host?.getStepParams?.('fieldSettings', 'init') || origin?.getStepParams?.('fieldSettings', 'init');
    // 解析 collectionField（优先使用原字段上的引用；必要时从 dataSourceManager 回落）
    let collectionField = origin?.collectionField as any;
    if (!collectionField && init?.dataSourceKey && init?.collectionName && init?.fieldPath) {
      const key = `${init.dataSourceKey}.${init.collectionName}.${init.fieldPath}`;
      collectionField = model?.context?.dataSourceManager?.getCollectionField?.(key);
    }
    // 再次回退：直接使用宿主上下文上的 collectionField（在很多配置面板场景可用）
    if (!collectionField) {
      collectionField = (host as any)?.context?.collectionField;
    }
    // 如果 origin 是一个具体的字段子模型（例如筛选表单中的日期动态组件），优先沿用该模型的类，
    // 这样“默认值”编辑器就能与真实字段保持一致（避免总是退化为普通可编辑模型）。
    const PreferredClassFromOrigin = (origin as any)?.constructor as any;
    // 兜底：从可编辑绑定获取类，用于常规表单字段
    const editableBinding = collectionField
      ? EditableItemModel.getDefaultBindingByField(model?.context as any, collectionField)
      : null;
    // 如果是关系的对多字段，或绑定缺失，采用兜底策略
    const relationType = collectionField?.type;
    const relationInterface = collectionField?.interface;
    const isToManyRelation =
      relationType === 'belongsToMany' ||
      relationType === 'hasMany' ||
      relationType === 'belongsToArray' ||
      relationInterface === 'm2m' ||
      relationInterface === 'o2m' ||
      relationInterface === 'mbm';
    const shouldKeepDropdownOpenOnSelect = Boolean(stableMergedFlags?.isInSetDefaultValueDialog && isToManyRelation);

    const FallbackClass = isToManyRelation ? RecordSelectFieldModel : InputFieldModel;
    const BoundClass = editableBinding
      ? (model?.context?.engine?.getModelClass?.(editableBinding.modelName) as any)
      : null;
    const PreferredClass =
      typeof PreferredClassFromOrigin === 'function' ? (PreferredClassFromOrigin as any) : (null as any);
    // 当来源是筛选字段（类名以 FilterFieldModel 结尾）时优先采用来源类，否则采用可编辑绑定类
    const originIsFilterField =
      typeof (PreferredClassFromOrigin as any)?.name === 'string' &&
      /FilterFieldModel$/.test((PreferredClassFromOrigin as any).name);
    const shouldPreferOriginClass = originIsFilterField || Boolean((host as any)?.customFieldModelInstance);
    const BaseClass = shouldPreferOriginClass
      ? PreferredClass || BoundClass || FallbackClass
      : BoundClass || PreferredClass || FallbackClass;
    const TempFieldClass = createTempFieldClass(BaseClass);
    // 继承原关系字段的显示映射，避免默认值编辑器回退为 id 展示
    const inheritedFieldNames = (origin as any)?.props?.fieldNames;
    const inheritedTitleField = (origin as any)?.props?.titleField;
    // 继承 selectSettings 中已保存的参数（如 title-field、多选开关）
    const inheritedSelectFieldNamesStep = (origin as any)?.getStepParams?.('selectSettings', 'fieldNames');
    const inheritedSelectAllowMultipleStep = (origin as any)?.getStepParams?.('selectSettings', 'allowMultiple');
    const tempFieldStepParams: Record<string, any> = {};
    if (init) {
      tempFieldStepParams.fieldSettings = { init };
    }
    if (inheritedSelectFieldNamesStep || inheritedSelectAllowMultipleStep) {
      tempFieldStepParams.selectSettings = {
        ...(inheritedSelectFieldNamesStep ? { fieldNames: inheritedSelectFieldNamesStep } : {}),
        ...(inheritedSelectAllowMultipleStep ? { allowMultiple: inheritedSelectAllowMultipleStep } : {}),
      };
    }
    const fieldSub = {
      use: TempFieldClass,
      uid: uid(),
      parentId: null,
      subKey: null,
      subType: null,
      stepParams: {
        ...(origin?.stepParams || {}),
        ...(Object.keys(tempFieldStepParams).length ? tempFieldStepParams : {}),
      },
      // 默认值编辑器不应继承原字段当前值，否则会把“筛选表单实时值”误显示为“默认值”。
      props: {
        disabled: false,
        allowClear: true,
        ...originPropsWithoutValue,
        ...(typeof inheritedFieldNames !== 'undefined' ? { fieldNames: inheritedFieldNames } : {}),
        ...(typeof inheritedTitleField !== 'undefined' ? { titleField: inheritedTitleField } : {}),
        ...(shouldKeepDropdownOpenOnSelect ? { keepDropdownOpenOnSelect: true } : {}),
        ...hostCustomFieldPropsWithoutValue,
      },
    };
    const created = model.context.engine.createModel({
      use: 'VariableFieldFormModel',
      subModels: { fields: [fieldSub] },
    });
    const tempFieldModel = created.subModels?.fields?.[0];
    if (tempFieldModel) {
      tempFieldModel._originalModel = origin;
      tempFieldModel._originalPropsFallback = host?.customFieldProps;
      tempFieldModel._fallbackCollectionField = (host as any)?.context?.collectionField;
      tempFieldModel._originalOptionsFallback =
        snapshotOptions((origin as any)?.getDataSource?.()) ||
        snapshotOptions((origin as any)?.props?.options) ||
        snapshotOptions(host?.customFieldProps?.options);
    }
    if (init?.dataSourceKey && init?.collectionName) {
      const dataSourceManager = model.context.dataSourceManager;
      const dataSource = dataSourceManager?.getDataSource?.(init.dataSourceKey);
      const targetCollection = dataSourceManager?.getCollection?.(init.dataSourceKey, init.collectionName);
      if (dataSource) created.context?.defineProperty?.('dataSource', { get: () => dataSource });
      if (targetCollection) created.context?.defineProperty?.('collection', { get: () => targetCollection });
    }
    if (stableMergedFlags) {
      created.context?.defineProperty?.('flags', { value: stableMergedFlags });
    }
    return created;
  }, [model, stableMergedFlags]);

  // Cleanup temporary models on unmount to avoid leaking into engine instance map
  React.useEffect(() => {
    return () => {
      tempRoot.subModels?.fields?.forEach((fieldModelItem: any) => fieldModelItem?.remove?.());
      tempRoot.remove();
    };
  }, [tempRoot]);

  // Right-side editor (the field component itself)
  const InputComponent = useMemo(() => {
    const ConstantValueEditor = (inputProps) => {
      const initializedRef = React.useRef(false);
      const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
      const lastParentValueRef = React.useRef<any>(Symbol('init'));
      const lastAppliedValueRef = React.useRef<any>(Symbol('none'));
      const composingRef = React.useRef(false);
      React.useEffect(() => {
        const fieldModel = tempRoot?.subModels?.fields?.[0];
        if (!fieldModel) return;
        const { disabled, readOnly, readPretty, pattern, ...rest } = inputProps || {};
        // 关联字段的选择值需要传入记录对象而不是 antd Option
        const isAssociation = !!fieldModel?.context?.collectionField?.isAssociationField?.();
        // 利用类型守卫避免不必要的 any
        const hasData = (val: unknown): val is { data: unknown } =>
          !!val && typeof val === 'object' && 'data' in (val as Record<string, unknown>);
        const toRecordValue = (v: unknown) => {
          if (Array.isArray(v)) return v.map((i) => (hasData(i) ? i.data : i));
          return hasData(v) ? v.data : v;
        };
        // 文本类：
        // - 以模型类型判断（_originalModel.use === 'InputFieldModel' 或当前 use 名称）
        // - 以接口判断的回退（兼容 email/phone/url/uuid/nanoid/textarea/markdown/richText/password/color 等都走文本输入）
        const originalUseName = (fieldModel as any)?._originalModel?.use || (fieldModel as any)?.use;
        const iface = (fieldModel as any)?.context?.collectionField?.interface as string | undefined;
        const textIfaceSet = new Set([
          'input',
          'email',
          'phone',
          'uuid',
          'url',
          'nanoid',
          'textarea',
          'markdown',
          // richText 在本组件中按受控组件处理，避免编辑时被“非受控”策略干扰
          'password',
          'color',
        ]);
        const isTextLike =
          originalUseName === 'InputFieldModel' ||
          (iface ? textIfaceSet.has(iface) : fieldModel instanceof InputFieldModel);
        const pickPrimitive = (n: any) => {
          if (n && typeof n === 'object' && 'target' in n) {
            const target = (n as any)?.target;
            if (isTextLike && typeof target?.value !== 'undefined') {
              return target.value;
            }
            if (typeof target?.checked !== 'undefined') {
              return target.checked;
            }
            if (typeof target?.value !== 'undefined') {
              return target.value;
            }
          }
          return n;
        };
        // 将 VariableInput 提供的受控属性透传到临时字段模型上，确保受控生效
        // - value: 由 VariableInput 控制
        // - onChange: 回传给 VariableInput，从而驱动 Formily/外层表单值
        // - 组合输入事件: 保障中文等输入法的正确行为
        // - 其他样式/属性: 透传但不覆盖我们的可编辑设定
        fieldModel.setProps({
          disabled: false,
          // 透传 change：
          // - 优先取第一个参数（兼容 Input/Select 等）；
          // - 对于 antd DatePicker/RangePicker 这类 (date, dateString) 的情况，若第二个参数为字符串或字符串数组，优先取第二个参数。
          onChange: (...args: any[]) => {
            const preferSecond =
              args.length > 1 &&
              (typeof args[1] === 'string' || (Array.isArray(args[1]) && args[1].every((i) => typeof i === 'string')));
            const next = preferSecond ? args[1] : args[0];
            const out = isAssociation ? toRecordValue(next) : pickPrimitive(next);
            // 即时镜像到临时字段，保证受控组件（日期/选择等）在当前弹窗内也能立刻显示选择结果
            if (!isTextLike) {
              const applied = isAssociation ? toRecordValue(next) : pickPrimitive(next);
              lastAppliedValueRef.current = applied;
              fieldModel.setProps({ value: applied, defaultValue: undefined });
            }
            // 文本类在合成输入期间不抛出 onChange，待 compositionEnd 再一次性抛出
            if (isTextLike && composingRef.current) return;
            (rest?.onChange ?? inputProps?.onChange)?.(out);
            // 触发本地重渲，确保 FlowModelRenderer 重新执行 model.render()
            forceUpdate();
          },
          onCompositionStart: (...args: any[]) => {
            composingRef.current = true;
            rest?.onCompositionStart?.(...args);
            inputProps?.onCompositionStart?.(...args);
          },
          onCompositionUpdate: rest?.onCompositionUpdate ?? inputProps?.onCompositionUpdate,
          onCompositionEnd: (e: any) => {
            composingRef.current = false;
            const v = pickPrimitive(e);
            // 合成结束时再抛出一次变化，保证中文输入等场景
            (rest?.onChange ?? inputProps?.onChange)?.(v);
            rest?.onCompositionEnd?.(e);
            inputProps?.onCompositionEnd?.(e);
          },
          style: { width: '100%', minWidth: 0, ...(rest?.style || inputProps?.style) },
        });
        // 始终保持可编辑
        fieldModel.setPattern?.('editable');

        // 首次挂载时，使用 DefaultValue 外层传入的 value 作为默认显示值
        if (!initializedRef.current) {
          initializedRef.current = true;
          const initial = value;
          if (typeof initial !== 'undefined') {
            fieldModel.setProps({ defaultValue: initial });
          }
        }
        // 非文本类统一受控；文本类不受控（仅初始化 defaultValue）。
        // 仅当外层 value 实际变化时才镜像到临时字段，避免覆盖用户在本弹窗中的即时选择。
        if (!isTextLike) {
          const parentVal = value;
          const changedFromParent = parentVal !== lastParentValueRef.current;
          if (changedFromParent) {
            lastParentValueRef.current = parentVal;
            if (typeof parentVal !== 'undefined') {
              const applied = isAssociation ? toRecordValue(parentVal) : pickPrimitive(parentVal);
              lastAppliedValueRef.current = applied;
              fieldModel.setProps({ value: applied });
              // 由外层驱动时也重渲，确保 UI 同步
              forceUpdate();
            }
          }
        }
      }, [inputProps, value]);
      return (
        <div style={{ flexGrow: 1 }}>
          <FlowModelRenderer model={tempRoot} showFlowSettings={false} />
        </div>
      );
    };
    return ConstantValueEditor;
  }, [tempRoot]);

  // 文本类多关键词：根据已注册的 operator schema 渲染（用于默认值配置）
  React.useEffect(() => {
    const operator = (model as any)?.operator;
    const fieldModel = tempRoot?.subModels?.fields?.[0];
    if (!operator || !fieldModel) return;
    const originalRender = fieldModel['__originalRender'] || fieldModel.render;
    fieldModel['__originalRender'] = originalRender;

    const resolved = resolveOperatorComponent(
      model.context.app,
      operator,
      model.collectionField?.filterable?.operators || [],
    );

    if (resolved && fieldModel instanceof InputFieldModel) {
      const { Comp, props: xProps } = resolved;
      fieldModel.render = () => (
        <Comp
          {...fieldModel.props}
          {...xProps}
          style={{ width: '100%', ...(fieldModel.props as any)?.style, ...xProps?.style }}
        />
      );
    } else if (typeof originalRender === 'function') {
      fieldModel.render = originalRender;
    }
  }, [model, tempRoot, (model as any)?.operator]);

  // 根据操作符 schema 的 x-component-props 补全临时字段的输入属性（如多选）
  React.useEffect(() => {
    const operator = (model as any)?.operator;
    const fieldModel = tempRoot?.subModels?.fields?.[0];
    if (!fieldModel || !operator) return;
    const ops = model.collectionField?.filterable?.operators || [];
    const meta = ops.find((op) => op.value === operator);
    const xComponentProps = meta?.schema?.['x-component-props'];
    if (xComponentProps) {
      fieldModel.setProps(xComponentProps);
    }
  }, [model, tempRoot, (model as any)?.operator]);

  const NullComponent = useMemo(() => {
    function NullValuePlaceholder() {
      return <Input placeholder={`<${flowContext.t?.('Null') ?? 'Null'}>`} readOnly />;
    }
    return NullValuePlaceholder;
  }, [flowContext]);

  const RunJSComponent = useMemo(() => {
    const C: React.FC<any> = (inputProps) => (
      <RunJSValueEditor t={flowContext.t} value={inputProps?.value} onChange={inputProps?.onChange} />
    );
    return C;
  }, [flowContext]);
  const mergedMetaTree = useMemo<() => Promise<MetaTreeNode[]>>(() => {
    return async () => {
      let base: MetaTreeNode[] = [];
      if (typeof propMetaTree === 'function') {
        base = ((await propMetaTree()) || []) as MetaTreeNode[];
      } else if (Array.isArray(propMetaTree)) {
        base = propMetaTree as MetaTreeNode[];
      } else {
        base = ((flowContext.getPropertyMetaTree?.() || []) as MetaTreeNode[]) || [];
      }
      return [
        {
          title: flowContext.t?.('Constant') ?? 'Constant',
          name: 'constant',
          type: 'string',
          paths: ['constant'],
          render: InputComponent as (props: any) => JSX.Element,
        },
        {
          title: flowContext.t?.('Null') ?? 'Null',
          name: 'null',
          type: 'object',
          paths: ['null'],
          render: NullComponent as (props: any) => JSX.Element,
        },
        {
          title: flowContext.t?.('RunJS') ?? 'RunJS',
          name: 'runjs',
          type: 'object',
          paths: ['runjs'],
          render: RunJSComponent as (props: any) => JSX.Element,
        },
        ...base,
      ];
    };
  }, [propMetaTree, flowContext, InputComponent, NullComponent, RunJSComponent]);

  // Ensure temp field is editable. Do not override value/onChange here to avoid racing with VariableInput
  React.useEffect(() => {
    const tempFieldModel: any = tempRoot.subModels.fields?.[0];
    tempFieldModel?.setProps({ disabled: false });
  }, [tempRoot, value]);

  return (
    <VariableInput
      metaTree={mergedMetaTree}
      value={value}
      // 变量切换时不回填原始表单，等待保存/确定时机
      onChange={onChange}
      {...restProps}
      converters={{
        renderInputComponent: (meta) => {
          const firstPath = meta?.paths?.[0];
          if (firstPath === 'constant') return InputComponent;
          if (firstPath === 'null') return NullComponent;
          if (firstPath === 'runjs') return RunJSComponent;
          return VariableTag;
        },
        resolveValueFromPath: (item) => {
          const firstPath = item?.paths?.[0];
          if (firstPath === 'constant') return '';
          if (firstPath === 'null') return null;
          if (firstPath === 'runjs') return { code: '', version: 'v1' };
          return undefined;
        },
        resolvePathFromValue: (currentValue) => {
          if (currentValue === null) return ['null'];
          if (isRunJSValue(currentValue)) return ['runjs'];
          return isVariableExpression(currentValue) ? parseValueToPath(currentValue) : ['constant'];
        },
      }}
    />
  );
});
