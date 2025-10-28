/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
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

interface Props {
  value: any;
  onChange: (value: any) => void;
  metaTree: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
  model: FieldModel;
}

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
      const fallbackCollectionField = this._originalModel?.collectionField;
      if (collectionFieldFromManager || fallbackCollectionField)
        this.context.defineProperty('collectionField', {
          get: () => collectionFieldFromManager || fallbackCollectionField,
        });
    }
    async onDispatchEventEnd(eventName: string) {
      if (eventName !== 'beforeRender') return;
      const originalProps = this._originalModel?.props || {};
      const collectionField = this.context?.collectionField;
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
      const multiple =
        typeof originalProps.multiple !== 'undefined' ? originalProps.multiple : inferMultipleFromCollectionField();
      if (typeof multiple !== 'undefined') {
        this.setProps({ multiple });
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
  const { value, onChange, metaTree: propMetaTree, ...restProps } = props;
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
      if (!fieldIndex?.length) return nameParts;
      const [lastField, indexStr] = fieldIndex[fieldIndex.length - 1].split(':');
      const idx = Number(indexStr);
      const lastIndex = nameParts.findIndex((p) => String(p) === lastField);
      if (lastIndex === -1) return nameParts;
      return [idx, ...nameParts.slice(lastIndex + 1)];
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

  // Build a temporary field model (isolated), using collectionField's recommended editable subclass
  const tempRoot = useMemo(() => {
    const host = model;
    const origin = host?.customFieldModelInstance || host?.subModels?.field;
    const init = host?.getStepParams?.('fieldSettings', 'init') || origin?.getStepParams?.('fieldSettings', 'init');
    // 解析 collectionField（优先使用原字段上的引用；必要时从 dataSourceManager 回落）
    let collectionField = origin?.collectionField as any;
    if (!collectionField && init?.dataSourceKey && init?.collectionName && init?.fieldPath) {
      const key = `${init.dataSourceKey}.${init.collectionName}.${init.fieldPath}`;
      collectionField = model?.context?.dataSourceManager?.getCollectionField?.(key);
    }
    // 尝试从可编辑绑定中获取字段模型（避免在 readPretty 下拿到展示型模型）
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

    const FallbackClass = isToManyRelation ? RecordSelectFieldModel : InputFieldModel;
    const BoundClass = editableBinding
      ? (model?.context?.engine?.getModelClass?.(editableBinding.modelName) as any)
      : null;
    const TempFieldClass = createTempFieldClass(BoundClass || FallbackClass);
    const fieldSub = {
      use: TempFieldClass,
      uid: uid(),
      parentId: null,
      subKey: null,
      subType: null,
      stepParams: init ? { fieldSettings: { init } } : undefined,
      props: { disabled: false, allowClear: true, ...host?.customFieldProps },
    };
    const created = model.context.engine.createModel({
      use: 'VariableFieldFormModel',
      subModels: { fields: [fieldSub] },
    });
    const tempFieldModel = created.subModels?.fields?.[0];
    if (tempFieldModel) {
      tempFieldModel._originalModel = origin;
    }
    if (init?.dataSourceKey && init?.collectionName) {
      const dataSourceManager = model.context.dataSourceManager;
      const dataSource = dataSourceManager?.getDataSource?.(init.dataSourceKey);
      const targetCollection = dataSourceManager?.getCollection?.(init.dataSourceKey, init.collectionName);
      if (dataSource) created.context?.defineProperty?.('dataSource', { get: () => dataSource });
      if (targetCollection) created.context?.defineProperty?.('collection', { get: () => targetCollection });
    }
    return created;
  }, [model]);

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
      React.useEffect(() => {
        const fieldModel = tempRoot?.subModels?.fields?.[0];
        if (!fieldModel) return;
        const { disabled, readOnly, readPretty, pattern, ...rest } = inputProps || {};
        // 关联字段的选择值需要传入记录对象而不是 antd Option
        const isAssociation = !!fieldModel?.context?.collectionField?.isAssociationField?.();
        const toRecordValue = (v: any) => {
          if (Array.isArray(v)) return v.map((i) => (i && typeof i === 'object' && 'data' in i ? i.data : i));
          return v && typeof v === 'object' && 'data' in v ? (v as any).data : v;
        };
        // 将 VariableInput 提供的受控属性透传到临时字段模型上，确保受控生效
        // - value: 由 VariableInput 控制
        // - onChange: 回传给 VariableInput，从而驱动 Formily/外层表单值
        // - 组合输入事件: 保障中文等输入法的正确行为
        // - 其他样式/属性: 透传但不覆盖我们的可编辑设定
        fieldModel.setProps({
          disabled: false,
          // 仅透传事件，避免把输入框变为完全受控，从而影响输入法
          onChange: (val: any) => (rest?.onChange ?? inputProps?.onChange)?.(isAssociation ? toRecordValue(val) : val),
          onCompositionStart: rest?.onCompositionStart ?? inputProps?.onCompositionStart,
          onCompositionUpdate: rest?.onCompositionUpdate ?? inputProps?.onCompositionUpdate,
          onCompositionEnd: rest?.onCompositionEnd ?? inputProps?.onCompositionEnd,
          style: { width: '100%', minWidth: 0, ...(rest?.style || inputProps?.style) },
        });
        // 始终保持可编辑
        fieldModel.setPattern?.('editable');

        // 首次挂载时，将当前值作为默认显示值，确保重新打开能回显上次保存的常量
        if (!initializedRef.current) {
          initializedRef.current = true;
          const initial = (rest?.value ?? inputProps?.value) as any;
          if (typeof initial !== 'undefined') {
            fieldModel.setProps({ defaultValue: initial });
          }
        }
        // 关联字段在受控场景下需要同步 value 才能正常显示选中项
        if (isAssociation) {
          const current = (rest?.value ?? inputProps?.value) as any;
          if (typeof current !== 'undefined') {
            fieldModel.setProps({ value: toRecordValue(current) });
          }
        }
      }, [inputProps]);
      return (
        <div style={{ flexGrow: 1 }}>
          <FlowModelRenderer model={tempRoot} showFlowSettings={false} />
        </div>
      );
    };
    return ConstantValueEditor;
  }, [tempRoot]);
  const NullComponent = useMemo(() => {
    function NullValuePlaceholder() {
      return <Input placeholder={`<${flowContext.t?.('Null') ?? 'Null'}>`} readOnly />;
    }
    return NullValuePlaceholder;
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
          render: InputComponent,
        },
        {
          title: flowContext.t?.('Null') ?? 'Null',
          name: 'null',
          type: 'object',
          paths: ['null'],
          render: NullComponent,
        },
        ...base,
      ];
    };
  }, [propMetaTree, flowContext, InputComponent, NullComponent]);

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
          return VariableTag;
        },
        resolveValueFromPath: (item) => {
          const firstPath = item?.paths?.[0];
          if (firstPath === 'constant') return '';
          if (firstPath === 'null') return null;
          return undefined;
        },
        resolvePathFromValue: (currentValue) => {
          if (currentValue === null) return ['null'];
          return isVariableExpression(currentValue) ? parseValueToPath(currentValue) : ['constant'];
        },
      }}
    />
  );
});
