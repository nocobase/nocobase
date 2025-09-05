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
  isVariableExpression,
  parseValueToPath,
  useFlowContext,
  useFlowSettingsContext,
  extractPropertyPath,
} from '@nocobase/flow-engine';
import { get, isEqual } from 'lodash';
import React, { useMemo, useRef } from 'react';
import { Input } from 'antd';
import { EditableFieldModel } from '../models';

interface Props {
  value: any;
  onChange: (value: any) => void;
  metaTree: MetaTreeNode[] | (() => Promise<MetaTreeNode[]>);
  model: EditableFieldModel;
}

function createTempFieldClass(Base: any) {
  return class Temp extends Base {
    async onBeforeAutoFlows() {
      const p = this.getStepParams?.('fieldSettings', 'init') || {};
      const k =
        p?.dataSourceKey &&
        p?.collectionName &&
        p?.fieldPath &&
        `${p.dataSourceKey}.${p.collectionName}.${p.fieldPath}`;
      const cf = k && this.context?.dataSourceManager?.getCollectionField?.(k);
      const fb = this.props?.originalModel?.collectionField;
      if (cf || fb) this.context.defineProperty('collectionField', { get: () => cf || fb });
    }
    async onAfterAutoFlows() {
      // Ensure the temp field respects original props for behavior consistency
      // especially the `multiple` flag for to-many relationships
      const originalProps = (this.props as any)?.originalModel?.props || {};
      const collectionField = (this.context as any)?.collectionField;
      const inferMultipleFromCF = () => {
        try {
          const t = collectionField?.type;
          const i = collectionField?.interface;
          // to-many: belongsToMany / hasMany, and interfaces m2m / o2m / mbm
          const byType = t && (t === 'belongsToMany' || t === 'hasMany' || t === 'belongsToArray');
          const byIface = i && (i === 'm2m' || i === 'o2m' || i === 'mbm');
          return !!(byType || byIface);
        } catch (e) {
          return undefined;
        }
      };
      const multiple = typeof originalProps.multiple !== 'undefined' ? originalProps.multiple : inferMultipleFromCF();
      if (typeof multiple !== 'undefined') {
        this.setProps({ multiple });
      }

      this.showTitle?.(null);
      this.setDescription?.(null);
      this.setPattern?.('editable');
      if (this.props.onChange) this.setProps({ onChange: this.props.onChange });
      const v = this.getStepParams('formItemSettings', 'initialValue')?.defaultValue;
      if (typeof v !== 'undefined') this.setProps({ value: v });
    }
  };
}

export const DefaultValue = connect((props: Props) => {
  const { value, onChange } = props;
  const { model } = useFlowContext();
  const settings = useFlowSettingsContext();

  // Build a temporary field model (isolated), using collectionField's recommended editable subclass
  const tempRoot = useMemo(() => {
    const host = model;
    const origin = host?.subModels?.field;
    const init = host?.getStepParams?.('fieldSettings', 'init') || origin?.getStepParams?.('fieldSettings', 'init');
    const Target = origin?.constructor || (model.constructor as any);
    const Temp = createTempFieldClass(Target);
    const fieldSub = {
      use: Temp,
      uid: uid(),
      parentId: null,
      subKey: null,
      subType: null,
      stepParams: init ? { fieldSettings: { init } } : undefined,
      props: { disabled: false, originalModel: origin },
    } as any;
    const created = model.context.engine.createModel({
      use: 'VariableFieldFormModel',
      subModels: { fields: [fieldSub] },
    } as any);
    if (init?.dataSourceKey && init?.collectionName) {
      const dsm = model.context.dataSourceManager;
      const ds = dsm?.getDataSource?.(init.dataSourceKey);
      const col = dsm?.getCollection?.(init.dataSourceKey, init.collectionName);
      if (ds) created.context?.defineProperty?.('dataSource', { get: () => ds });
      if (col) created.context?.defineProperty?.('collection', { get: () => col });
    }
    return created;
  }, [model]);

  // Cleanup temporary models on unmount to avoid leaking into engine instance map
  React.useEffect(() => {
    return () => {
      const fields = tempRoot.subModels?.fields || [];
      if (Array.isArray(fields)) {
        fields.forEach((m) => m?.remove?.());
      }
      tempRoot.remove();
    };
  }, [tempRoot]);

  // Right-side editor (the field component itself)
  const InputComponent = useMemo(
    () => (p) => (
      <div style={{ flexGrow: 1 }}>
        {tempRoot.setProps({ ...p })}
        <FlowModelRenderer model={tempRoot} showFlowSettings={false} />
      </div>
    ),
    [tempRoot],
  );
  const NullComponent = useMemo(() => () => <Input placeholder="<Null>" readOnly />, []);
  const metaTree = useMemo<MetaTreeNode[]>(() => {
    const tree = (useFlowContext().getPropertyMetaTree?.() || []) as MetaTreeNode[];
    return [
      { title: 'Constant', name: 'constant', type: 'string', paths: ['constant'], render: InputComponent },
      { title: 'Null', name: 'null', type: 'object', paths: ['null'], render: NullComponent },
      ...tree,
    ];
  }, [InputComponent, NullComponent]);

  // Pass value/handler to the temp field
  React.useEffect(() => {
    const fm = tempRoot.subModels.fields?.[0] as any;
    fm?.setProps({
      disabled: false,
      value,
      onChange: (ev: any) => onChange?.(ev && typeof ev === 'object' && 'target' in ev ? ev.target.value : ev),
    });
  }, [tempRoot, onChange, value]);

  // Apply on OK: only set default if field not modified by user
  const namePathRef = useRef<any[]>([]);
  React.useEffect(() => {
    const stepKey = 'initialValue';
    const initial = settings.getStepParams?.(stepKey) || {};
    const form: any = settings.model?.context?.form;
    const raw: any = (settings.model as any)?.props?.name || (settings.model as any)?.fieldPath;
    const namePath = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split('.') : [raw].filter(Boolean);
    namePathRef.current = namePath as any[];
    return () => {
      setTimeout(() => {
        const latest = settings.getStepParams?.(stepKey) || {};
        if (!isEqual(initial, latest)) {
          const f: any = settings.model?.context?.form;
          if (!f || !namePathRef.current.length) return;
          // Do not override if user has interacted with this field
          if (f?.isFieldsTouched?.([namePathRef.current as any])) return;
          let v = latest?.defaultValue;
          if (isVariableExpression(v)) {
            const p = extractPropertyPath(String(v));
            if (p) v = get(settings.model.context as any, p.join('.'));
          }
          if (f.setFieldValue) f.setFieldValue(namePathRef.current as any, v);
          else if (f.setFieldsValue) f.setFieldsValue({ [namePathRef.current.join('.')]: v });
        }
      }, 0);
    };
  }, [settings]);

  return (
    <VariableInput
      metaTree={metaTree}
      {...props}
      converters={{
        resolveValueFromPath: (item) => (item?.paths?.[0] === 'constant' ? '' : undefined),
        resolvePathFromValue: (val) => (isVariableExpression(val) ? parseValueToPath(val) : ['constant']),
      }}
    />
  );
});
