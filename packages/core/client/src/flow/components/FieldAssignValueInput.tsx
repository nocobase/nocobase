/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input } from 'antd';
import {
  FlowModelRenderer,
  VariableInput,
  tExpr,
  isVariableExpression,
  parseValueToPath,
  useFlowContext,
  EditableItemModel,
} from '@nocobase/flow-engine';
import { ensureOptionsFromUiSchemaEnumIfAbsent } from '../internal/utils/enumOptionsUtils';

interface Props {
  fieldUid: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
}

/**
 * 根据所选字段渲染对应的赋值编辑器：
 * - 使用临时的 VariableFieldFormModel 包裹字段模型，确保常量编辑为真实字段组件
 * - 支持变量引用，并提供 Constant / Null 两种快捷项
 */
export const FieldAssignValueInput: React.FC<Props> = ({ fieldUid, value, onChange, placeholder }) => {
  const flowCtx = useFlowContext();

  // 在当前表单网格中定位到选中的字段模型（FormItemModel 实例）
  const itemModel = React.useMemo(() => {
    try {
      const items = flowCtx.model?.subModels?.grid?.subModels?.items || [];
      return items.find((m: any) => m?.uid === fieldUid);
    } catch (e) {
      return undefined;
    }
  }, [flowCtx, fieldUid]);

  // 解析 collection/field 基础信息
  const { collection, dataSource, blockModel } = itemModel?.context || {};
  const init = itemModel?.getStepParams?.('fieldSettings', 'init') || {};
  const fieldPath: string | undefined = init?.fieldPath;
  const fieldName = fieldPath?.split('.').slice(-1)[0];

  // 生成临时根模型 + 子字段模型
  const [tempRoot, setTempRoot] = React.useState<any>(null);
  React.useEffect(() => {
    if (!itemModel || !collection || !fieldPath) return;
    const engine = itemModel?.context?.engine || flowCtx.model?.context?.engine;
    const fields = typeof collection?.getFields === 'function' ? collection.getFields() || [] : [];
    const f = fields.find((x: any) => x?.name === fieldName);
    const binding = EditableItemModel.getDefaultBindingByField(itemModel?.context, f);
    if (!binding) {
      return;
    }
    const fieldModelUse = binding.modelName;

    const created = engine?.createModel?.({
      use: 'VariableFieldFormModel',
      subModels: {
        fields: [
          {
            use: fieldModelUse,
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection?.dataSourceKey,
                  collectionName: collection?.name,
                  fieldPath,
                },
              },
            },
            props: {
              placeholder,
            },
          },
        ],
      },
    });
    if (!created) return;

    // 注入上下文（集合/数据源/字段/区块/资源）
    created.context?.defineProperty?.('collection', { value: collection });
    if (dataSource) created.context?.defineProperty?.('dataSource', { value: dataSource });
    const cf = typeof collection?.getField === 'function' ? collection.getField(fieldName) : undefined;
    if (cf) created.context?.defineProperty?.('collectionField', { value: cf });
    if (blockModel) created.context?.defineProperty?.('blockModel', { value: blockModel });
    if (created.context) {
      Object.defineProperty(created.context, 'resource', {
        configurable: true,
        enumerable: true,
        get: () => blockModel?.resource,
      });
    }

    // 字段模型基础属性设定
    const fm = created?.subModels?.fields?.[0];
    const relType = cf?.type;
    const relInterface = cf?.interface;
    const multiple =
      relType === 'belongsToMany' ||
      relType === 'hasMany' ||
      relType === 'belongsToArray' ||
      relInterface === 'm2m' ||
      relInterface === 'o2m' ||
      relInterface === 'mbm';
    fm?.setProps?.({
      disabled: false,
      readPretty: false,
      pattern: 'editable',
      updateAssociation: false,
      multiple,
    });
    fm?.dispatchEvent?.('beforeRender', undefined, { sequential: true, useCache: true });
    // 为本地枚举型字段补全可选项（仅在未显式传入 options 时处理）
    ensureOptionsFromUiSchemaEnumIfAbsent(fm, cf);
    if (!fm?.props?.fieldNames && cf?.targetCollection) {
      const targetCol = cf.targetCollection;
      const valueKey = cf?.targetKey || targetCol?.filterTargetKey || 'id';
      fm?.setProps?.({ fieldNames: { label: (targetCol as any)?.titleField, value: valueKey } });
    }

    setTempRoot(created);
    return () => {
      created.subModels.fields.forEach?.((m) => m.remove());
      created.remove();
    };
  }, [itemModel, collection, dataSource, blockModel, fieldPath, fieldName, flowCtx]);

  // 同步 value/onChange 到临时根与字段模型
  React.useEffect(() => {
    if (!tempRoot) return;
    const normalize = (eventOrValue: any) =>
      eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue
        ? (eventOrValue as any).target?.value
        : eventOrValue;
    tempRoot.setProps?.({
      value,
      onChange: (ev: any) => onChange?.(normalize(ev)),
    });
    const fm = tempRoot?.subModels?.fields?.[0];
    fm?.setProps?.({
      value,
      onChange: (ev: any) => onChange?.(normalize(ev)),
    });
  }, [tempRoot, value, onChange]);

  // 常量/空值的两个占位渲染器
  const ConstantValueEditor = React.useMemo(() => {
    const C: React.FC<any> = (inputProps) => {
      React.useEffect(() => {
        const normalize = (eventOrValue: any) =>
          eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue
            ? (eventOrValue as any).target?.value
            : eventOrValue;
        tempRoot?.setProps?.({
          ...inputProps,
          onChange: (ev: any) => inputProps?.onChange?.(normalize(ev)),
        });
        const fm = tempRoot?.subModels?.fields?.[0];
        fm?.setProps?.({
          value: inputProps?.value,
          onChange: (ev: any) => inputProps?.onChange?.(normalize(ev)),
        });
      }, [inputProps]);
      return tempRoot ? (
        <div style={{ flex: 1, minWidth: 0 }}>
          <FlowModelRenderer model={tempRoot} showFlowSettings={false} />
        </div>
      ) : null;
    };
    return C;
  }, [tempRoot]);

  const NullComponent = React.useMemo(() => {
    const N: React.FC = () => (
      <Input placeholder={`<${flowCtx.t?.('Null') ?? 'Null'}>`} readOnly style={{ width: '100%' }} />
    );
    return N;
  }, [flowCtx]);

  const metaTree = React.useMemo<() => Promise<any[]>>(() => {
    return async () => {
      const base = (await flowCtx.getPropertyMetaTree?.()) || [];
      return [
        {
          title: tExpr('Constant'),
          name: 'constant',
          type: 'string',
          paths: ['constant'],
          render: ConstantValueEditor,
        },
        { title: tExpr('Null'), name: 'null', type: 'object', paths: ['null'], render: NullComponent },
        ...base,
      ];
    };
  }, [flowCtx, ConstantValueEditor, NullComponent]);

  if (!itemModel || !fieldPath) {
    // 不可用占位
    return <Input disabled placeholder={flowCtx.t?.('Please select a field') ?? 'Please select a field'} />;
  }

  return (
    <VariableInput
      value={value}
      onChange={onChange}
      metaTree={metaTree}
      style={{ width: '100%' }}
      clearValue={''}
      converters={{
        renderInputComponent: (meta) => {
          const firstPath = meta?.paths?.[0];
          if (firstPath === 'constant') return ConstantValueEditor as any;
          if (firstPath === 'null') return NullComponent as any;
          return undefined as any;
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
};
