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
} from '@nocobase/flow-engine';
import { get } from 'lodash';
import React, { useMemo } from 'react';
import { Input } from 'antd';
import { EditableFieldModel } from '../models';
import { RemoteSelectFieldModel } from '../models/fields/AssociationFieldModel';

interface Props {
  value: any;
  onChange: (value: any) => void;
  metaTree: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
  model: EditableFieldModel;
}

// 近似 AntD 的 NamePath，用于减少 any 断言
type NamePathLike = (string | number)[];

function createTempFieldClass(Base: any, hostModel: any, valueRef: React.MutableRefObject<any>) {
  return class Temp extends Base {
    __restoreSave?: () => void;
    async onBeforeAutoFlows() {
      const initParams = this.getStepParams?.('fieldSettings', 'init') || {};
      const collectionFieldKey =
        initParams?.dataSourceKey &&
        initParams?.collectionName &&
        initParams?.fieldPath &&
        `${initParams.dataSourceKey}.${initParams.collectionName}.${initParams.fieldPath}`;
      const collectionFieldFromManager =
        collectionFieldKey && this.context?.dataSourceManager?.getCollectionField?.(collectionFieldKey);
      const fallbackCollectionField = this.props?.originalModel?.collectionField;
      if (collectionFieldFromManager || fallbackCollectionField)
        this.context.defineProperty('collectionField', {
          get: () => collectionFieldFromManager || fallbackCollectionField,
        });
    }
    async onAfterAutoFlows() {
      // Ensure the temp field respects original props for behavior consistency
      // especially the `multiple` flag for to-many relationships
      const originalProps = (this.props as { originalModel?: { props?: any } } | undefined)?.originalModel?.props || {};
      const collectionField = (this.context as { collectionField?: any } | undefined)?.collectionField;
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

      this.showTitle?.(null);
      this.setDescription?.(null);
      this.setPattern?.('editable');
      if (this.props.onChange) this.setProps({ onChange: this.props.onChange });
      const initialValueFromStep = this.getStepParams('formItemSettings', 'initialValue')?.defaultValue;
      if (typeof initialValueFromStep !== 'undefined') this.setProps({ value: initialValueFromStep });

      // Patch host model's saveStepParams so we can apply default after saving once
      const host: any = hostModel;
      const originalSaveStepParams = host?.saveStepParams?.bind(host);
      if (originalSaveStepParams && !this.__restoreSave) {
        const rawName: unknown = host?.props?.name ?? host?.fieldPath;
        const namePath: NamePathLike = Array.isArray(rawName)
          ? rawName
          : typeof rawName === 'string'
            ? rawName.split('.')
            : [rawName].filter(Boolean);
        host.saveStepParams = async (...saveArgs: any[]) => {
          const result = await originalSaveStepParams(...saveArgs);
          const form: any = host?.context?.form;
          if (form && namePath.length) {
            const touched = !!form?.isFieldsTouched?.([namePath]);
            if (!touched) {
              let defaultValueCandidate = valueRef.current;
              if (isVariableExpression(defaultValueCandidate)) {
                // Prefer backend-capable resolution for variables that may require async fetching
                const ctx: any = host.context;
                const resolved = await ctx.resolveJsonTemplate(defaultValueCandidate);
                if (resolved !== undefined) {
                  defaultValueCandidate = resolved;
                }
                // Fallback: attempt to extract value from local context path
                if (defaultValueCandidate === valueRef.current) {
                  const propertyPath = extractPropertyPath(String(defaultValueCandidate));
                  if (propertyPath) defaultValueCandidate = get(ctx, propertyPath.join('.'));
                }
              }
              // Avoid writing undefined back to the form which may wipe existing values
              if (defaultValueCandidate !== undefined) {
                if (form?.setFieldValue) {
                  form.setFieldValue(namePath, defaultValueCandidate);
                } else {
                  const fieldKey = namePath.join('.');
                  form?.setFieldsValue?.({ [fieldKey]: defaultValueCandidate });
                }
              } else {
                // skip backfill when resolved value is undefined
              }
            }
          }
          return result;
        };
        this.__restoreSave = () => {
          host.saveStepParams = originalSaveStepParams;
        };
      }
    }

    remove(...args: any[]) {
      this.__restoreSave?.();
      // @ts-ignore
      super.remove?.(...args);
    }
  };
}

export const DefaultValue = connect((props: Props) => {
  const { value, onChange, metaTree: propMetaTree, ...restProps } = props;
  const flowContext = useFlowContext();
  const { model } = flowContext;
  const latestValueRef = React.useRef<any>(value);
  React.useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const backfillOriginalForm = React.useCallback(
    async (raw: any) => {
      const host: any = model;
      const form: any = host?.context?.form;
      const rawName: unknown = host?.props?.name ?? host?.fieldPath;
      const namePath: NamePathLike = Array.isArray(rawName)
        ? rawName
        : typeof rawName === 'string'
          ? rawName.split('.')
          : [rawName].filter(Boolean);
      if (!form || !namePath.length) return;
      const touched = !!form?.isFieldsTouched?.([namePath]);
      if (touched) return;

      let defaultValue = raw;
      if (isVariableExpression(defaultValue)) {
        const ctx: any = host.context;
        const resolved = await ctx.resolveJsonTemplate(defaultValue);
        if (resolved !== undefined) defaultValue = resolved;
        if (defaultValue === raw) {
          const propertyPath = extractPropertyPath(String(defaultValue));
          if (propertyPath) defaultValue = get(host.context as Record<string, any>, propertyPath.join('.'));
        }
      }

      if (defaultValue !== undefined) {
        if (form?.setFieldValue) {
          form.setFieldValue(namePath, defaultValue);
        } else {
          const fieldKey = namePath.join('.');
          form?.setFieldsValue?.({ [fieldKey]: defaultValue });
        }
      }
    },
    [model],
  );

  // Build a temporary field model (isolated), using collectionField's recommended editable subclass
  const tempRoot = useMemo(() => {
    const host = model;
    const origin = host?.subModels?.field;
    const init = host?.getStepParams?.('fieldSettings', 'init') || origin?.getStepParams?.('fieldSettings', 'init');
    // 如果是关系的对多字段，统一使用 RemoteSelectFieldModel 作为默认值渲染模型
    const collectionField = origin?.collectionField;
    const relationType = collectionField?.type;
    const relationInterface = collectionField?.interface;
    const isToManyRelation =
      relationType === 'belongsToMany' ||
      relationType === 'hasMany' ||
      relationType === 'belongsToArray' ||
      relationInterface === 'm2m' ||
      relationInterface === 'o2m' ||
      relationInterface === 'mbm';
    const fieldModelClass = isToManyRelation ? RemoteSelectFieldModel : origin?.constructor || model.constructor;
    const TempFieldClass = createTempFieldClass(fieldModelClass, model, latestValueRef);
    const fieldSub = {
      use: TempFieldClass,
      uid: uid(),
      parentId: null,
      subKey: null,
      subType: null,
      stepParams: init ? { fieldSettings: { init } } : undefined,
      props: { disabled: false, originalModel: origin },
    };
    const created = model.context.engine.createModel({
      use: 'VariableFieldFormModel',
      subModels: { fields: [fieldSub] },
    });
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
      React.useEffect(() => {
        tempRoot.setProps({ ...inputProps });
      }, [tempRoot, inputProps]);
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

  // Pass value/handler to the temp field
  React.useEffect(() => {
    const tempFieldModel: any = tempRoot.subModels.fields?.[0];
    tempFieldModel?.setProps({
      disabled: false,
      value,
      onChange: (eventOrValue: any) => {
        const nextValue =
          eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue
            ? eventOrValue.target.value
            : eventOrValue;
        onChange?.(nextValue);
        Promise.resolve()
          .then(() => backfillOriginalForm(nextValue))
          .catch((_) => {
            // ignore
          });
      },
    });
  }, [tempRoot, onChange, value, backfillOriginalForm]);

  return (
    <VariableInput
      metaTree={mergedMetaTree}
      value={value}
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
