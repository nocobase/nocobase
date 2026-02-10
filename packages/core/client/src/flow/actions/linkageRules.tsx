/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionScene,
  defineAction,
  tExpr,
  FlowContext,
  FlowModel,
  FlowRuntimeContext,
  useFlowContext,
  useFlowEngine,
  createSafeWindow,
  createSafeDocument,
  createSafeNavigator,
  observer,
  isRunJSValue,
  normalizeRunJSValue,
  runjsWithSafeGlobals,
} from '@nocobase/flow-engine';
import { evaluateConditions, FilterGroupType, removeInvalidFilterItems } from '@nocobase/utils/client';
import React from 'react';
import { Collapse, Input, Button, Switch, Space, Tooltip, Empty, Dropdown, Select } from 'antd';
import {
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CopyOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { uid } from '@formily/shared';
import { FilterGroup } from '../components/filter/FilterGroup';
import { LinkageFilterItem } from '../components/filter';
import { CodeEditor } from '../components/code-editor';
import { FieldAssignRulesEditor } from '../components/FieldAssignRulesEditor';
import type { FieldAssignRuleItem } from '../components/FieldAssignRulesEditor';
import { collectFieldAssignCascaderOptions } from '../components/fieldAssignOptions';
import _ from 'lodash';
import { SubFormFieldModel, SubFormListFieldModel } from '../models';
import { coerceForToOneField } from '../internal/utils/associationValueCoercion';
import {
  findFormItemModelByFieldPath,
  getCollectionFromModel,
  isToManyAssociationField,
} from '../internal/utils/modelUtils';
import { namePathToPathKey, parsePathString, resolveDynamicNamePath } from '../models/blocks/form/value-runtime/path';

interface LinkageRule {
  /** 随机生成的字符串 */
  key: string;
  /** 联动规则的标题 */
  title: string;
  /** 是否启用，默认为 true */
  enable: boolean;
  /** 联动规则的条件部分 */
  condition: FilterGroupType;
  /** 联动规则的动作部分 */
  actions: {
    key: string;
    name: string;
    params?: any;
  }[];
}

const previewValueForLog = (value: any) => {
  if (value == null) return value;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return value;
  if (Array.isArray(value)) {
    if (value.length <= 3) return value;
    return `[Array(${value.length})]`;
  }
  if (t === 'object') {
    const id = (value as any)?.id;
    if (id != null) return { id };
    return '[Object]';
  }
  return `[${t}]`;
};

const getLinkageScopeDepthFromModel = (model: any): number => {
  let depth = 0;
  let cursor = model;
  while (cursor) {
    if (cursor instanceof SubFormFieldModel || cursor instanceof SubFormListFieldModel) {
      depth += 1;
    }
    cursor = cursor?.parent;
  }
  return depth;
};

const getLinkageScopeDepthFromContext = (ctx: FlowContext): number => {
  const fromCtx = Number((ctx as any)?.linkageScopeDepth);
  if (Number.isFinite(fromCtx)) return fromCtx;
  return getLinkageScopeDepthFromModel((ctx as any)?.model);
};

// 获取表单中所有字段的 model 实例的通用函数
const getFormFields = (ctx: any) => {
  try {
    const fieldModels = ctx.model?.subModels?.grid?.subModels?.items || [];
    return fieldModels.map((model: any) => ({
      label: model.props.label || model.props.name,
      value: model.uid,
      model,
    }));
  } catch (error) {
    console.warn('Failed to get form fields:', error);
    return [];
  }
};

const getFormFieldsByForkModel = (ctx: any) => {
  try {
    const fieldModels = ctx.model?.subModels?.grid?.subModels?.items || [];
    return fieldModels.map((model: any) => {
      const forkModel = Array.from(model.forks)[0] as any;

      if (forkModel) {
        return {
          label: forkModel?.props.label || forkModel?.props.name,
          value: forkModel?.uid || model.uid,
          model: forkModel,
        };
      }

      return {
        label: model.props.label || model.props.name,
        value: model.uid,
        model,
      };
    });
  } catch (error) {
    console.warn('Failed to get form fields:', error);
    return [];
  }
};

type ParsedFieldIndexEntry = {
  fieldName: string;
  index: number;
};

function normalizeFieldKeyParts(fieldKey: string): string[] {
  const s = fieldKey;
  // tolerate array stringification like "a:0,b:1"
  if (s.includes(',') && s.includes(':')) {
    return s
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return s ? [s] : [];
}

function parseFieldIndexEntry(entry: string): ParsedFieldIndexEntry | null {
  const [fieldName, indexStr] = String(entry || '').split(':');
  if (!fieldName) return null;
  const index = Number(indexStr);
  if (!Number.isFinite(index)) return null;
  return { fieldName, index };
}

function buildAbsoluteFieldPathArray(
  fieldPath: string | undefined,
  fieldKey: any,
): {
  fieldPathArray: Array<string | number>;
  // path to the (innermost) Form.List root, e.g. ['user', 'comments'] (without index)
  listRootPath?: Array<string | number>;
  // row index for the innermost Form.List
  listRowIndex?: number;
  hasUnmatchedIndices: boolean;
} | null {
  if (!fieldPath) return null;

  const pathParts = String(fieldPath)
    .split('.')
    .map((v) => v.trim())
    .filter(Boolean);
  if (!pathParts.length) return null;

  const indices = normalizeFieldKeyParts(fieldKey).map(parseFieldIndexEntry).filter(Boolean) as ParsedFieldIndexEntry[];

  let idxPtr = 0;
  const out: Array<string | number> = [];
  let listRootPath: Array<string | number> | undefined;
  let listRowIndex: number | undefined;

  for (const part of pathParts) {
    out.push(part);
    const cur = indices[idxPtr];
    if (cur && cur.fieldName === part) {
      listRootPath = [...out];
      listRowIndex = cur.index;
      out.push(cur.index);
      idxPtr += 1;
    }
  }

  return {
    fieldPathArray: out,
    listRootPath,
    listRowIndex,
    hasUnmatchedIndices: idxPtr < indices.length,
  };
}

function normalizeAssignRuleItemsFromLinkageParams(
  raw: any,
  legacy: { mode: 'default' | 'assign'; valueKey: 'assignValue' | 'initialValue' },
  resolveTargetPath?: (legacyFieldUid: string) => string | undefined,
): FieldAssignRuleItem[] {
  if (Array.isArray(raw)) {
    return raw as any;
  }

  if (!raw || typeof raw !== 'object') return [];

  // legacy object params: { field, assignValue } | { field, initialValue }
  const legacyField = (raw as any)?.field;
  const legacyValue = (raw as any)?.[legacy.valueKey];
  if (legacyField) {
    const targetPath = resolveTargetPath?.(String(legacyField));
    if (!targetPath) return [];
    return [
      {
        key: 'legacy',
        enable: true,
        targetPath,
        mode: legacy.mode,
        condition: { logic: '$and', items: [] },
        value: legacyValue,
      },
    ];
  }

  // legacy empty: keep empty list
  return [];
}

function createLegacyTargetPathResolver(ctx: FlowContext) {
  return (legacyFieldUid: string) => {
    try {
      const m: any = ctx.engine?.getModel?.(legacyFieldUid);
      const fp = m?.getStepParams?.('fieldSettings', 'init')?.fieldPath || m?.fieldPath;
      return fp ? String(fp) : undefined;
    } catch (error) {
      console.warn(`Failed to resolve legacy field uid ${legacyFieldUid}:`, error);
      return undefined;
    }
  };
}

const SKIP_RUNJS_ASSIGN_VALUE = Symbol('SKIP_RUNJS_ASSIGN_VALUE');

async function resolveLinkageAssignRuntimeValue(ctx: FlowContext, rawValue: any) {
  if (!isRunJSValue(rawValue)) {
    return rawValue;
  }

  try {
    const { code, version } = normalizeRunJSValue(rawValue);
    const ret = await runjsWithSafeGlobals(ctx, code, { version });
    if (!ret?.success) {
      return SKIP_RUNJS_ASSIGN_VALUE;
    }
    return ret.value;
  } catch (error) {
    console.warn('[linkageRules] Failed to evaluate RunJS assign value', error);
    return SKIP_RUNJS_ASSIGN_VALUE;
  }
}

function getSubFormHostFieldPath(ctx: FlowContext): string | null {
  const tryReadFieldPath = (model: any): string | null => {
    if (!model || typeof model !== 'object') return null;
    const fromStepParams = model?.getStepParams?.('fieldSettings', 'init')?.fieldPath;
    const fromFieldPath = model?.fieldPath;
    const fieldPath =
      (typeof fromStepParams === 'string' && fromStepParams) ||
      (typeof fromFieldPath === 'string' && fromFieldPath) ||
      '';
    return fieldPath || null;
  };

  // row fork 场景下，直接 parent 常为 grid model，需要向上回溯到真正的子表单宿主字段模型
  let cursor: any = (ctx.model as any)?.parent;
  while (cursor) {
    const fieldPath = tryReadFieldPath(cursor);
    if (fieldPath) return fieldPath;
    cursor = cursor?.parent;
  }

  // 兜底：部分上下文通过 delegate 暴露 prefixFieldPath
  const fromPrefix = (ctx.model as any)?.context?.prefixFieldPath;
  if (typeof fromPrefix === 'string' && fromPrefix) {
    return fromPrefix;
  }

  return null;
}

function normalizeSubFormTargetPath(
  ctx: FlowContext,
  rawTargetPath: string,
): {
  targetPath: string;
  fieldModel: any;
} | null {
  const targetPath = String(rawTargetPath || '').trim();
  if (!targetPath) return null;

  const hit = findFormItemModelByFieldPath(ctx.model, targetPath);
  if (hit) {
    return {
      targetPath,
      fieldModel: hit,
    };
  }

  const hostFieldPath = getSubFormHostFieldPath(ctx);
  if (!hostFieldPath) {
    return null;
  }

  const hostSegs = String(hostFieldPath)
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean);
  const rawSegs = String(targetPath)
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!hostSegs.length || !rawSegs.length) {
    return null;
  }

  const joinSegs = (segs: string[]) => segs.filter(Boolean).join('.');
  const candidates: string[] = [];
  const pushCandidate = (path: string) => {
    const normalized = String(path || '').trim();
    if (!normalized) return;
    if (!candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  pushCandidate(targetPath);

  // 重叠拼接：例如 host="M2M.M2M" + raw="M2M.Name" => "M2M.M2M.Name"
  const overlapCandidates: string[] = [];
  const maxOverlap = Math.min(hostSegs.length, rawSegs.length);
  for (let overlap = maxOverlap; overlap >= 1; overlap--) {
    const hostTail = hostSegs.slice(hostSegs.length - overlap);
    const rawHead = rawSegs.slice(0, overlap);
    if (!_.isEqual(hostTail, rawHead)) continue;
    const merged = joinSegs([...hostSegs, ...rawSegs.slice(overlap)]);
    if (merged && !overlapCandidates.includes(merged)) {
      overlapCandidates.push(merged);
    }
    pushCandidate(merged);
  }

  const prefixed = joinSegs([...hostSegs, ...rawSegs]);
  pushCandidate(prefixed);

  for (const candidate of candidates) {
    const matched = findFormItemModelByFieldPath(ctx.model, candidate);
    if (matched) {
      return {
        targetPath: candidate,
        fieldModel: matched,
      };
    }
  }

  // 无可命中字段模型时，按最安全且最可能正确的规则选择写入目标：
  // 1) 单段路径默认视为“当前子表单相对路径” => host + raw
  // 2) 多段路径若能与 host 后缀重叠，则优先重叠拼接结果
  // 3) 否则保留原路径（避免盲目前缀导致越级）
  const chosenPath = rawSegs.length === 1 ? prefixed : overlapCandidates.length > 0 ? overlapCandidates[0] : targetPath;

  if (!chosenPath) {
    return null;
  }

  return {
    targetPath: chosenPath,
    fieldModel: null,
  };
}

export const linkageSetBlockProps = defineAction({
  name: 'linkageSetBlockProps',
  title: tExpr('Set block state'),
  scene: ActionScene.BLOCK_LINKAGE_RULES,
  sort: 100,
  uiSchema: {
    value: {
      type: 'string',
      'x-component': (props) => {
        const { value, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        return (
          <Select
            value={value}
            onChange={onChange}
            placeholder={t('Please select state')}
            style={{ width: '100%' }}
            options={[
              { label: t('Visible'), value: 'visible' },
              { label: t('Hidden'), value: 'hidden' },
            ]}
            allowClear
          />
        );
      },
    },
  },
  handler(ctx, { value, setProps }) {
    setProps(ctx.model, { hiddenModel: value === 'hidden' });
  },
});

export const linkageSetActionProps = defineAction({
  name: 'linkageSetActionProps',
  title: tExpr('Set button state'),
  scene: ActionScene.ACTION_LINKAGE_RULES,
  sort: 100,
  uiSchema: {
    value: {
      type: 'string',
      'x-component': (props) => {
        const { value, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        return (
          <Select
            value={value}
            onChange={onChange}
            placeholder={t('Please select state')}
            style={{ width: '100%' }}
            options={[
              { label: t('Visible'), value: 'visible' },
              { label: t('Hidden'), value: 'hidden' },
              { label: t('Hidden text'), value: 'hiddenText' },
              { label: t('Enabled'), value: 'enabled' },
              { label: t('Disabled'), value: 'disabled' },
            ]}
            allowClear
          />
        );
      },
    },
  },
  handler(ctx, { value, setProps }) {
    setProps(ctx.model, {
      hiddenModel: value === 'hidden',
      disabled: value === 'disabled',
      hiddenText: value === 'hiddenText',
    });
  },
});

export const linkageSetFieldProps = defineAction({
  name: 'linkageSetFieldProps',
  title: tExpr('Set field state'),
  scene: ActionScene.FIELD_LINKAGE_RULES,
  sort: 100,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value = { fields: [] }, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const fieldOptions = getFormFields(ctx);

        // 状态选项
        const stateOptions = [
          { label: t('Visible'), value: 'visible' },
          { label: t('Hidden'), value: 'hidden' },
          { label: t('Hidden (reserved value)'), value: 'hiddenReservedValue' },
          { label: t('Required'), value: 'required' },
          { label: t('Not required'), value: 'notRequired' },
          { label: t('Disabled'), value: 'disabled' },
          { label: t('Enabled'), value: 'enabled' },
        ];

        const handleFieldsChange = (selectedFields: string[]) => {
          onChange({
            ...value,
            fields: selectedFields,
          });
        };

        const handleStateChange = (selectedState: string) => {
          onChange({
            ...value,
            state: selectedState,
          });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('Fields')}</div>
              <Select
                mode="multiple"
                value={value.fields}
                onChange={handleFieldsChange}
                placeholder={t('Please select fields')}
                style={{ width: '100%' }}
                options={fieldOptions}
                showSearch
                // @ts-ignore
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                allowClear
              />
            </div>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('State')}</div>
              <Select
                value={value.state}
                onChange={handleStateChange}
                placeholder={t('Please select state')}
                style={{ width: '100%' }}
                options={stateOptions}
                allowClear
              />
            </div>
          </div>
        );
      },
    },
  },
  handler: (ctx, { value, setProps }) => {
    const { fields, state } = value || {};

    if (!fields || !Array.isArray(fields) || !state) {
      return;
    }

    // 根据 uid 找到对应的字段 model 并设置属性
    fields.forEach((fieldUid: string) => {
      try {
        const gridModels = ctx.model?.subModels?.grid?.subModels?.items || [];
        const fieldModel = gridModels.find((model: any) => model.uid === fieldUid);

        if (fieldModel) {
          let props: any = {};

          switch (state) {
            case 'visible':
              props = { hiddenModel: false };
              break;
            case 'hidden':
              props = { hiddenModel: true };
              break;
            case 'hiddenReservedValue':
              props = { hidden: true };
              break;
            case 'required':
              props = { required: true };
              break;
            case 'notRequired':
              props = { required: false };
              break;
            case 'disabled':
              props = { disabled: true };
              break;
            case 'enabled':
              props = { disabled: false };
              break;
            default:
              console.warn(`Unknown state: ${state}`);
              return;
          }

          setProps(fieldModel as FlowModel, props);
        }
      } catch (error) {
        console.warn(`Failed to set props for field ${fieldUid}:`, error);
      }
    });
  },
});

export const subFormLinkageSetFieldProps = defineAction({
  name: 'subFormLinkageSetFieldProps',
  title: tExpr('Set field state'),
  scene: ActionScene.SUB_FORM_FIELD_LINKAGE_RULES,
  sort: 100,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value = { fields: [] }, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const fieldOptions = getFormFieldsByForkModel(ctx);

        // 状态选项
        const stateOptions = [
          { label: t('Visible'), value: 'visible' },
          { label: t('Hidden'), value: 'hidden' },
          { label: t('Hidden (reserved value)'), value: 'hiddenReservedValue' },
          { label: t('Required'), value: 'required' },
          { label: t('Not required'), value: 'notRequired' },
          { label: t('Disabled'), value: 'disabled' },
          { label: t('Enabled'), value: 'enabled' },
        ];

        const handleFieldsChange = (selectedFields: string[]) => {
          onChange({
            ...value,
            fields: selectedFields,
          });
        };

        const handleStateChange = (selectedState: string) => {
          onChange({
            ...value,
            state: selectedState,
          });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('Fields')}</div>
              <Select
                mode="multiple"
                value={value.fields}
                onChange={handleFieldsChange}
                placeholder={t('Please select fields')}
                style={{ width: '100%' }}
                options={fieldOptions}
                showSearch
                // @ts-ignore
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                allowClear
              />
            </div>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('State')}</div>
              <Select
                value={value.state}
                onChange={handleStateChange}
                placeholder={t('Please select state')}
                style={{ width: '100%' }}
                options={stateOptions}
                allowClear
              />
            </div>
          </div>
        );
      },
    },
  },
  handler: (ctx, { value, setProps }) => {
    const { fields, state } = value || {};

    if (!fields || !Array.isArray(fields) || !state) {
      return;
    }

    // 根据 uid 找到对应的字段 model 并设置属性
    fields.forEach((fieldUid: string) => {
      try {
        const formItemModel = ctx.engine?.getModel?.(fieldUid);
        if (!formItemModel) {
          console.warn('[subFormLinkageSetFieldProps] Target field model not found', {
            fieldUid,
            modelUid: ctx.model?.uid,
          });
          return;
        }

        const fieldKey = ctx.model?.context?.fieldKey;
        const forkKey = fieldKey ? `${fieldKey}:${fieldUid}` : undefined;
        const forkModel =
          forkKey && typeof (formItemModel as any).getFork === 'function'
            ? (formItemModel as any).getFork(forkKey)
            : null;

        let model = forkModel;

        // 适配对一子表单的场景
        if (!forkModel) {
          model = formItemModel;
        }

        if (model) {
          let props: any = {};

          switch (state) {
            case 'visible':
              props = { hiddenModel: false };
              break;
            case 'hidden':
              props = { hiddenModel: true };
              break;
            case 'hiddenReservedValue':
              props = { hidden: true };
              break;
            case 'required':
              props = { required: true };
              break;
            case 'notRequired':
              props = { required: false };
              break;
            case 'disabled':
              props = { disabled: true };
              break;
            case 'enabled':
              props = { disabled: false };
              break;
            default:
              console.warn(`Unknown state: ${state}`);
              return;
          }

          setProps(model as FlowModel, props);
        }
      } catch (error) {
        console.warn(`Failed to set props for field ${fieldUid}:`, error);
      }
    });
  },
});

export const linkageSetDetailsFieldProps = defineAction({
  name: 'linkageSetDetailsFieldProps',
  title: tExpr('Set field state'),
  scene: ActionScene.DETAILS_FIELD_LINKAGE_RULES,
  sort: 100,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value = { fields: [] }, onChange } = props;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const ctx = useFlowContext();
        const t = ctx.model.translate.bind(ctx.model);

        const fieldOptions = getFormFields(ctx);

        // 状态选项
        const stateOptions = [
          { label: t('Visible'), value: 'visible' },
          { label: t('Hidden'), value: 'hidden' },
          { label: t('Hidden (reserved value)'), value: 'hiddenReservedValue' },
        ];

        const handleFieldsChange = (selectedFields: string[]) => {
          onChange({
            ...value,
            fields: selectedFields,
          });
        };

        const handleStateChange = (selectedState: string) => {
          onChange({
            ...value,
            state: selectedState,
          });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('Fields')}</div>
              <Select
                mode="multiple"
                value={value.fields}
                onChange={handleFieldsChange}
                placeholder={t('Please select fields')}
                style={{ width: '100%' }}
                options={fieldOptions}
                showSearch
                // @ts-ignore
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                allowClear
              />
            </div>
            <div>
              <div style={{ marginBottom: '4px', fontSize: '14px' }}>{t('State')}</div>
              <Select
                value={value.state}
                onChange={handleStateChange}
                placeholder={t('Please select state')}
                style={{ width: '100%' }}
                options={stateOptions}
                allowClear
              />
            </div>
          </div>
        );
      },
    },
  },
  handler: (ctx, { value, setProps }) => {
    const { fields, state } = value || {};

    if (!fields || !Array.isArray(fields) || !state) {
      return;
    }

    // 根据 uid 找到对应的字段 model 并设置属性
    fields.forEach((fieldUid: string) => {
      try {
        const gridModels = ctx.model?.subModels?.grid?.subModels?.items || [];
        const fieldModel = gridModels.find((model: any) => model.uid === fieldUid);

        if (fieldModel) {
          let props: any = {};

          switch (state) {
            case 'visible':
              props = { hiddenModel: false };
              break;
            case 'hidden':
              props = { hiddenModel: true };
              break;
            case 'hiddenReservedValue':
              props = { hidden: true };
              break;
            default:
              console.warn(`Unknown state: ${state}`);
              return;
          }

          setProps(fieldModel as FlowModel, props);
        }
      } catch (error) {
        console.warn(`Failed to set props for field ${fieldUid}:`, error);
      }
    });
  },
});

type ArrayFieldComponentProps = {
  value?: unknown;
  onChange?: (value: unknown) => void;
};

const LEGACY_ASSIGN_RULE = { mode: 'assign', valueKey: 'assignValue' } as const;
const LEGACY_DEFAULT_RULE = { mode: 'default', valueKey: 'initialValue' } as const;

const FieldAssignRulesActionComponent: React.FC<
  ArrayFieldComponentProps & {
    legacy: typeof LEGACY_ASSIGN_RULE | typeof LEGACY_DEFAULT_RULE;
    fixedMode?: 'assign' | 'default';
  }
> = (props) => {
  const { value, onChange, legacy, fixedMode } = props;
  const ctx = useFlowContext();

  const t = React.useCallback((key: string) => ctx.model.translate(key), [ctx.model]);

  const fieldOptions = React.useMemo(() => {
    return collectFieldAssignCascaderOptions({
      formBlockModel: ctx.model,
      t,
      maxFormItemDepth: 1,
    });
  }, [ctx.model, t]);

  const normalized = normalizeAssignRuleItemsFromLinkageParams(value, legacy, createLegacyTargetPathResolver(ctx));

  const handleChange = React.useCallback(
    (next: FieldAssignRuleItem[]) => {
      if (typeof onChange !== 'function') return;
      if (!Array.isArray(next)) return onChange(next);
      return onChange(next);
    },
    [onChange],
  );

  return (
    <FieldAssignRulesEditor
      t={t}
      fieldOptions={fieldOptions}
      rootCollection={getCollectionFromModel(ctx.model)}
      value={normalized}
      onChange={handleChange}
      fixedMode={fixedMode}
    />
  );
};

const LinkageAssignFieldComponent: React.FC<ArrayFieldComponentProps> = (props) => {
  return <FieldAssignRulesActionComponent {...props} legacy={LEGACY_ASSIGN_RULE} />;
};

const SubFormLinkageAssignFieldComponent: React.FC<ArrayFieldComponentProps> = (props) => {
  return <FieldAssignRulesActionComponent {...props} legacy={LEGACY_ASSIGN_RULE} />;
};

const SetFieldsDefaultValueComponent: React.FC<ArrayFieldComponentProps> = (props) => {
  return <FieldAssignRulesActionComponent {...props} legacy={LEGACY_DEFAULT_RULE} fixedMode="default" />;
};

export const linkageAssignField = defineAction({
  name: 'linkageAssignField',
  title: tExpr('Field assignment'),
  scene: ActionScene.FIELD_LINKAGE_RULES,
  sort: 200,
  uiSchema: {
    value: {
      type: 'array',
      'x-component': LinkageAssignFieldComponent,
    },
  },
  handler: async (ctx, { value, setProps, addFormValuePatch }) => {
    const items = normalizeAssignRuleItemsFromLinkageParams(
      value,
      { mode: 'assign', valueKey: 'assignValue' },
      createLegacyTargetPathResolver(ctx),
    );
    if (!items.length) return;
    try {
      const evaluator = (path: any, operator: string, right: any) => {
        if (!operator) return true;
        return ctx.app.jsonLogic.apply({ [operator]: [path, right] });
      };

      for (const it of items) {
        if (it?.enable === false) continue;
        const targetPath = it?.targetPath ? String(it.targetPath) : '';
        if (!targetPath) continue;

        const condition = it?.condition;
        if (condition && !evaluateConditions(removeInvalidFilterItems(condition), evaluator as any)) {
          continue;
        }

        const fieldModel = findFormItemModelByFieldPath(ctx.model, targetPath);
        const top = targetPath.split('.')[0];
        const collectionField =
          (fieldModel as any)?.collectionField ?? getCollectionFromModel(ctx.model)?.getField?.(top);
        let runtimeValue = it?.value;
        if (isRunJSValue(runtimeValue)) {
          runtimeValue = await resolveLinkageAssignRuntimeValue(ctx, runtimeValue);
          if (runtimeValue === SKIP_RUNJS_ASSIGN_VALUE) {
            continue;
          }
        }

        const finalValue = coerceForToOneField(collectionField, runtimeValue);

        // 若赋值为空（如切换字段后清空），调用一次 setProps 触发清空临时 props，避免旧值残留
        if (typeof finalValue === 'undefined') {
          if (fieldModel) {
            setProps(fieldModel as FlowModel, {});
          }
          continue;
        }

        const mode = it?.mode === 'default' ? 'default' : 'assign';
        if (fieldModel) {
          if (mode === 'default') {
            setProps(fieldModel as FlowModel, { initialValue: finalValue });
          } else {
            setProps(fieldModel as FlowModel, { value: finalValue });
          }
        } else if (typeof addFormValuePatch === 'function') {
          // 对关联字段子属性（如 user.name）等没有独立 FormItemModel 的目标，直接写入表单值
          addFormValuePatch({ path: targetPath, value: finalValue, whenEmpty: mode === 'default' });
        }
      }
    } catch (error) {
      console.warn('[linkageAssignField] Failed to assign value to fields', error);
    }
  },
});

export const subFormLinkageAssignField = defineAction({
  name: 'subFormLinkageAssignField',
  title: tExpr('Field assignment'),
  scene: ActionScene.SUB_FORM_FIELD_LINKAGE_RULES,
  sort: 200,
  uiSchema: {
    value: {
      type: 'array',
      'x-component': SubFormLinkageAssignFieldComponent,
    },
  },
  handler: async (ctx, { value, setProps, addFormValuePatch }) => {
    // 字段赋值处理逻辑
    const items = normalizeAssignRuleItemsFromLinkageParams(
      value,
      { mode: 'assign', valueKey: 'assignValue' },
      createLegacyTargetPathResolver(ctx),
    );
    if (!items.length) return;
    try {
      const evaluator = (path: any, operator: string, right: any) => {
        if (!operator) return true;
        return ctx.app.jsonLogic.apply({ [operator]: [path, right] });
      };

      const getExplicitPathKeyStore = () => {
        const model = ctx.model as any;
        if (!(model?.__subFormLinkageExplicitPathKeys instanceof Set)) {
          model.__subFormLinkageExplicitPathKeys = new Set<string>();
        }
        return model.__subFormLinkageExplicitPathKeys as Set<string>;
      };

      const resolvePathKey = (path: string): string | null => {
        const namePath = resolveDynamicNamePath(path, (ctx.model as any)?.context?.fieldIndex);
        if (!Array.isArray(namePath) || !namePath.length) return null;
        const normalized = namePath.filter((seg) => typeof seg === 'string' || typeof seg === 'number') as Array<
          string | number
        >;
        if (!normalized.length) return null;
        return namePathToPathKey(normalized);
      };

      const markExplicitPathKeysFromInputArgs = () => {
        const inputArgs = (ctx as any)?.inputArgs as any;
        if (!inputArgs || inputArgs.source !== 'user') return;

        const changedPaths = Array.isArray(inputArgs.changedPaths) ? inputArgs.changedPaths : [];
        if (!changedPaths.length) return;

        const explicitPathKeys = getExplicitPathKeyStore();
        for (const rawPath of changedPaths) {
          let normalized: Array<string | number> | null = null;

          if (Array.isArray(rawPath)) {
            const segs = rawPath.filter((seg) => typeof seg === 'string' || typeof seg === 'number') as Array<
              string | number
            >;
            normalized = segs.length ? segs : null;
          } else if (typeof rawPath === 'string') {
            const namePath = resolveDynamicNamePath(rawPath, (ctx.model as any)?.context?.fieldIndex);
            if (Array.isArray(namePath) && namePath.length) {
              const segs = namePath.filter((seg) => typeof seg === 'string' || typeof seg === 'number') as Array<
                string | number
              >;
              normalized = segs.length ? segs : null;
            }
          }

          if (!normalized?.length) continue;
          explicitPathKeys.add(namePathToPathKey(normalized));
        }
      };

      const hasExplicitPathHit = (path: string): boolean => {
        const explicitPathKeys = getExplicitPathKeyStore();
        const targetPathKey = resolvePathKey(path);
        if (!targetPathKey) return false;
        if (explicitPathKeys.has(targetPathKey)) return true;

        const targetNamePath = resolveDynamicNamePath(path, (ctx.model as any)?.context?.fieldIndex);
        if (!Array.isArray(targetNamePath) || !targetNamePath.length) return false;

        const prefix: Array<string | number> = [];
        for (let i = 0; i < targetNamePath.length; i++) {
          const seg = targetNamePath[i];
          if (typeof seg !== 'string' && typeof seg !== 'number') continue;

          prefix.push(seg);
          const key = namePathToPathKey(prefix);
          if (!explicitPathKeys.has(key)) continue;

          const nextSeg = targetNamePath[i + 1];
          if (typeof nextSeg === 'number') {
            // ignore array container explicit hit (e.g. explicit `users` shouldn't block `users[0].name` defaults)
            continue;
          }
          return true;
        }

        return false;
      };

      markExplicitPathKeysFromInputArgs();

      const resolveTargetFieldModel = (fieldUid: string) => {
        const formItemModel = ctx.engine.getModel(fieldUid);
        if (!formItemModel) return null;

        const fieldKey = ctx?.model?.context?.fieldKey;
        const forkKey = fieldKey ? `${fieldKey}:${fieldUid}` : null;

        let model = forkKey ? formItemModel.getFork(forkKey) : null;

        // 对多子表单（Form.List）场景：
        // - 确保用于写入的 fieldPathArray 为可落地的“绝对路径”
        if (fieldKey) {
          const fieldPath =
            formItemModel?.fieldPath || formItemModel?.getStepParams?.('fieldSettings', 'init')?.fieldPath;
          const built = buildAbsoluteFieldPathArray(fieldPath, fieldKey);

          // 主动创建对应的 FormItem fork，并注入 fieldPathArray 供赋值使用
          if (!model && forkKey) {
            model = formItemModel.createFork({}, forkKey);
          }
          if (model?.isFork && built) {
            model?.context?.defineProperty?.('fieldPathArray', { value: built.fieldPathArray });
          }
        }

        // 适配对一子表单的场景（无行级 fieldKey）
        if (!model) {
          model = formItemModel as any;
        }

        return model as any;
      };

      for (const it of items) {
        if (it?.enable === false) continue;
        const rawTargetPath = it?.targetPath ? String(it.targetPath) : '';
        if (!rawTargetPath) continue;

        const normalized = normalizeSubFormTargetPath(ctx, rawTargetPath);
        if (!normalized?.targetPath) {
          continue;
        }

        const targetPath = normalized.targetPath;
        const itemModel = normalized.fieldModel || null;
        const fieldUid = itemModel?.uid ? String(itemModel.uid) : '';

        const condition = it?.condition;
        if (condition && !evaluateConditions(removeInvalidFilterItems(condition), evaluator as any)) {
          continue;
        }

        const mode = it?.mode === 'default' ? 'default' : 'assign';
        const actionName = (ctx.model as any)?.getAclActionName?.() ?? (ctx.model as any)?.context?.actionName;
        const isEditForm = actionName === 'update';
        const isNewItem = (ctx as any)?.item?.__is_new__ === true;
        if (mode === 'default' && isEditForm && !isNewItem) {
          continue;
        }

        const top = targetPath.split('.')[0];
        const collectionField =
          (itemModel as any)?.collectionField ??
          getCollectionFromModel((ctx.model as any)?.parent ?? ctx.model)?.getField?.(top);
        let runtimeValue = it?.value;
        if (isRunJSValue(runtimeValue)) {
          runtimeValue = await resolveLinkageAssignRuntimeValue(ctx, runtimeValue);
          if (runtimeValue === SKIP_RUNJS_ASSIGN_VALUE) {
            continue;
          }
        }

        const finalValue = coerceForToOneField(collectionField, runtimeValue);

        // 若赋值为空（如切换字段后清空），调用一次 setProps 触发清空临时 props，避免旧值残留
        if (typeof finalValue === 'undefined') {
          if (!fieldUid) continue;
          const model = resolveTargetFieldModel(fieldUid);
          if (model) setProps(model, {});
          continue;
        }

        if (!fieldUid) {
          if (mode === 'default' && hasExplicitPathHit(targetPath)) {
            continue;
          }
          if (typeof addFormValuePatch === 'function') {
            addFormValuePatch({ path: targetPath, value: finalValue, whenEmpty: mode === 'default' });
          }
          continue;
        }

        const model = resolveTargetFieldModel(fieldUid);
        if (!model) continue;

        if (mode === 'default') {
          setProps(model, { initialValue: finalValue });
        } else {
          setProps(model, { value: finalValue });
        }
      }
    } catch (error) {
      console.warn('[subFormLinkageAssignField] Failed to assign value to fields', error);
    }
  },
});

export const setFieldsDefaultValue = defineAction({
  name: 'setFieldsDefaultValue',
  title: tExpr('设置字段默认值'),
  scene: ActionScene.FIELD_LINKAGE_RULES,
  sort: 200,
  uiSchema: {
    value: {
      type: 'array',
      'x-component': SetFieldsDefaultValueComponent,
    },
  },
  handler: async (ctx, { value, setProps, addFormValuePatch }) => {
    const items = normalizeAssignRuleItemsFromLinkageParams(
      value,
      { mode: 'default', valueKey: 'initialValue' },
      createLegacyTargetPathResolver(ctx),
    );
    if (!items.length) return;
    try {
      const evaluator = (path: any, operator: string, right: any) => {
        if (!operator) return true;
        return ctx.app.jsonLogic.apply({ [operator]: [path, right] });
      };

      for (const it of items) {
        if (it?.enable === false) continue;
        const targetPath = it?.targetPath ? String(it.targetPath) : '';
        if (!targetPath) continue;

        const condition = it?.condition;
        if (condition && !evaluateConditions(removeInvalidFilterItems(condition), evaluator as any)) {
          continue;
        }

        const fieldModel = findFormItemModelByFieldPath(ctx.model, targetPath);
        const top = targetPath.split('.')[0];
        const collectionField =
          (fieldModel as any)?.collectionField ?? getCollectionFromModel(ctx.model)?.getField?.(top);
        let runtimeValue = it?.value;
        if (isRunJSValue(runtimeValue)) {
          runtimeValue = await resolveLinkageAssignRuntimeValue(ctx, runtimeValue);
          if (runtimeValue === SKIP_RUNJS_ASSIGN_VALUE) {
            continue;
          }
        }

        const finalInitialValue = coerceForToOneField(collectionField, runtimeValue);

        // 若赋值为空（如切换字段后清空），调用一次 setProps 触发清空临时 props，避免旧值残留
        if (typeof finalInitialValue === 'undefined') {
          if (fieldModel) {
            setProps(fieldModel as FlowModel, {});
          }
          continue;
        }

        if (fieldModel) {
          setProps(fieldModel as FlowModel, { initialValue: finalInitialValue });
        } else if (typeof addFormValuePatch === 'function') {
          // 对关联字段子属性等没有独立 FormItemModel 的目标：仅当当前值为空时写入一次，避免覆盖用户输入
          addFormValuePatch({ path: targetPath, value: finalInitialValue, whenEmpty: true });
        }
      }
    } catch (error) {
      console.warn('[setFieldsDefaultValue] Failed to set fields default value', error);
    }
  },
});

export const linkageRunjs = defineAction({
  name: 'linkageRunjs',
  title: tExpr('Execute JavaScript'),
  scene: [
    ActionScene.BLOCK_LINKAGE_RULES,
    ActionScene.FIELD_LINKAGE_RULES,
    ActionScene.ACTION_LINKAGE_RULES,
    ActionScene.DETAILS_FIELD_LINKAGE_RULES,
    ActionScene.SUB_FORM_FIELD_LINKAGE_RULES,
  ],
  sort: 300,
  useRawParams: true,
  uiSchema: {
    value: {
      type: 'object',
      'x-component': (props) => {
        const { value = { script: '' }, onChange } = props;
        const handleScriptChange = (script: string) => {
          onChange({
            ...value,
            script,
          });
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* <div
              style={{
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '6px',
                padding: '12px',
              }}
            >
              <div style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
                预留一个位置，用于显示一些提示信息
              </div>
            </div> */}
            <div>
              <CodeEditor
                value={value.script}
                onChange={handleScriptChange}
                height="200px"
                enableLinter={true}
                scene="linkage"
              />
            </div>
          </div>
        );
      },
    },
  },
  handler: async (ctx, { value }) => {
    // 执行 JS 脚本处理逻辑
    const { script } = value || {};

    if (!script || typeof script !== 'string') {
      return;
    }

    try {
      const navigator = createSafeNavigator();
      await ctx.runjs(script, { window: createSafeWindow({ navigator }), document: createSafeDocument(), navigator });
    } catch (error) {
      console.error('Script execution error:', error);
      // 可以选择显示错误信息给用户
      if (ctx.app?.message) {
        const msg = error instanceof Error ? error.message : String(error);
        ctx.app.message.error(`Script execution error: ${msg}`);
      }
    }
  },
});

function protectLinkageRunJsScripts(params: { value?: LinkageRule[] } & Record<string, any>) {
  const masked = _.cloneDeep(params || {}) as typeof params;
  const tokenToScript = new Map<string, string>();

  const mask = (script: string) => {
    const token = `__ncb_linkage_runjs_script_mask__${uid()}__`;
    tokenToScript.set(token, script);
    return token;
  };

  const rules = masked?.value;
  if (Array.isArray(rules)) {
    rules.forEach((rule) => {
      rule.actions.forEach((action) => {
        const actionName = action.name;
        if (actionName !== 'linkageRunjs' && actionName !== 'runjs') return;
        const script = _.get(action, ['params', 'value', 'script']);
        if (typeof script === 'string' && script.length) {
          _.set(action, ['params', 'value', 'script'], mask(script));
        }
        const code = _.get(action, ['params', 'code']);
        if (typeof code === 'string' && code.length) {
          _.set(action, ['params', 'code'], mask(code));
        }
      });
    });
  }

  const restore = (resolved: any) => {
    const rulesResolved = resolved?.value;
    if (Array.isArray(rulesResolved)) {
      rulesResolved.forEach((rule: LinkageRule) => {
        rule.actions.forEach((action) => {
          const actionName = action.name;
          if (actionName !== 'linkageRunjs' && actionName !== 'runjs') return;
          const script = _.get(action, ['params', 'value', 'script']);
          if (typeof script === 'string' && tokenToScript.has(script)) {
            _.set(action, ['params', 'value', 'script'], tokenToScript.get(script));
          }
          const code = _.get(action, ['params', 'code']);
          if (typeof code === 'string' && tokenToScript.has(code)) {
            _.set(action, ['params', 'code'], tokenToScript.get(code));
          }
        });
      });
    }
    return resolved;
  };

  return { masked, restore };
}

async function resolveLinkageRulesParamsPreservingRunJsScripts(ctx: FlowContext, params: any) {
  const { masked, restore } = protectLinkageRunJsScripts(params);
  const resolved = await ctx.resolveJsonTemplate(masked);
  return restore(resolved);
}

const LinkageRulesUI = observer(
  (props: { readonly value: LinkageRule[]; supportedActions: string[]; title?: string }) => {
    const { value: rules, supportedActions } = props;
    const ctx = useFlowContext();
    const flowEngine = useFlowEngine();
    const t = ctx.model.translate.bind(ctx.model);
    const assignPriorityTip = t('Assignment takes precedence over form field assignment');

    // 创建新规则的默认值
    const createNewRule = (): LinkageRule => ({
      key: uid(),
      title: t('Linkage rule'),
      enable: true,
      condition: { logic: '$and', items: [] } as FilterGroupType,
      actions: [],
    });

    // 添加新规则
    const handleAddRule = () => {
      rules.push(createNewRule());
    };

    // 删除规则
    const handleDeleteRule = (index: number) => {
      rules.splice(index, 1);
    };

    // 上移规则
    const handleMoveUp = (index: number) => {
      if (index > 0) {
        const rule = rules[index];
        rules.splice(index, 1);
        rules.splice(index - 1, 0, rule);
      }
    };

    // 下移规则
    const handleMoveDown = (index: number) => {
      if (index < rules.length - 1) {
        const rule = rules[index];
        rules.splice(index, 1);
        rules.splice(index + 1, 0, rule);
      }
    };

    // 复制规则
    const handleCopyRule = (index: number) => {
      const originalRule = _.cloneDeep(rules[index]);
      const newRule: LinkageRule = {
        ...originalRule,
        key: uid(),
        title: `${originalRule.title} (Copy)`,
      };
      rules.splice(index + 1, 0, newRule);
    };

    // 更新规则标题
    const handleTitleChange = (index: number, title: string) => {
      rules[index].title = title;
    };

    // 切换规则启用状态
    const handleToggleEnable = (index: number, enable: boolean) => {
      rules[index].enable = enable;
    };

    // 获取可用的动作类型
    const getActionsDefinition = () => {
      return supportedActions.map((actionName: string) => ctx.getAction(actionName));
    };

    // 添加动作
    const handleAddAction = (ruleIndex: number, actionName: string) => {
      const newAction = {
        key: uid(),
        name: actionName,
        params: undefined,
      };
      rules[ruleIndex].actions.push(newAction);
    };

    // 删除动作
    const handleDeleteAction = (ruleIndex: number, actionIndex: number) => {
      rules[ruleIndex].actions.splice(actionIndex, 1);
    };

    // 更新动作的值
    const handleActionValueChange = (ruleIndex: number, actionIndex: number, value: any) => {
      rules[ruleIndex].actions[actionIndex].params = value;
    };

    // 生成折叠面板的自定义标题
    const renderPanelHeader = (rule: LinkageRule, index: number) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flex: 1, marginRight: 16 }}>
          <Input
            value={rule.title}
            onChange={(e) => handleTitleChange(index, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Enter rule title"
          />
        </div>
        <Space onClick={(e) => e.stopPropagation()}>
          <Tooltip title={t('Delete')}>
            <Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteRule(index)} />
          </Tooltip>
          <Tooltip title={t('Move up')}>
            <Button
              type="text"
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={() => handleMoveUp(index)}
              disabled={index === 0}
            />
          </Tooltip>
          <Tooltip title={t('Move down')}>
            <Button
              type="text"
              size="small"
              icon={<ArrowDownOutlined />}
              onClick={() => handleMoveDown(index)}
              disabled={index === rules.length - 1}
            />
          </Tooltip>
          <Tooltip title={t('Copy')}>
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyRule(index)} />
          </Tooltip>
          <Switch
            size="small"
            checked={rule.enable}
            onChange={(checked) => handleToggleEnable(index, checked)}
            checkedChildren={t('Enable')}
            unCheckedChildren={t('Disable')}
          />
        </Space>
      </div>
    );

    // 生成折叠面板项
    const collapseItems = rules.map((rule, index) => ({
      key: rule.key,
      label: renderPanelHeader(rule, index),
      styles: {
        header: {
          display: 'flex',
          alignItems: 'center',
        },
      },
      children: (
        <div>
          {/* 条件部分 */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '16px',
                  backgroundColor: '#1890ff',
                  borderRadius: '2px',
                  marginRight: 8,
                }}
              ></div>
              <h4
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#262626',
                }}
              >
                {t('Condition')}
              </h4>
            </div>
            <div style={{ paddingLeft: 12 }}>
              <FilterGroup
                value={rule.condition}
                FilterItem={(props) => <LinkageFilterItem model={ctx.model} value={props.value} />}
              />
            </div>
          </div>

          {/* 动作部分 */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '16px',
                  backgroundColor: '#52c41a',
                  borderRadius: '2px',
                  marginRight: 8,
                }}
              ></div>
              <h4
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#262626',
                }}
              >
                {t('Actions')}
              </h4>
            </div>
            <div style={{ paddingLeft: 12 }}>
              {/* 渲染已有的动作 */}
              {rule.actions.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  {rule.actions.map((action, actionIndex) => {
                    const actionDef = ctx.getAction(action.name);
                    if (!actionDef) return null;

                    return (
                      <div
                        key={action.key}
                        style={{
                          border: '1px solid #f0f0f0',
                          borderRadius: '6px',
                          padding: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                          }}
                        >
                          <span style={{ fontWeight: 500, color: '#262626' }}>
                            {t(actionDef.title)}
                            {action.name === 'linkageAssignField' || action.name === 'subFormLinkageAssignField' ? (
                              <Tooltip title={assignPriorityTip}>
                                <QuestionCircleOutlined
                                  style={{ marginInlineStart: 4 }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Tooltip>
                            ) : null}
                            <span style={{ marginInlineStart: 2, marginInlineEnd: 8 }}>:</span>
                          </span>
                          <Tooltip title={t('Delete action')}>
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteAction(index, actionIndex)}
                            />
                          </Tooltip>
                        </div>
                        <div>
                          {flowEngine.flowSettings.renderStepForm({
                            uiSchema: actionDef.uiSchema,
                            initialValues: action.params,
                            flowEngine,
                            onFormValuesChange: (form: any) => handleActionValueChange(index, actionIndex, form.values),
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Add action 按钮 */}
              <Dropdown
                menu={{
                  items: getActionsDefinition().map((action) => ({
                    key: action.name,
                    label: t(action.title || action.name),
                    onClick: () => handleAddAction(index, action.name),
                  })),
                }}
                trigger={['hover']}
              >
                <Button type="link" icon={<PlusOutlined />} style={{ padding: 0, height: 'auto', textAlign: 'left' }}>
                  {t('Add action')}
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>
      ),
    }));

    return (
      <>
        {rules.length > 0 ? (
          <Collapse
            items={collapseItems}
            size="small"
            style={{ marginBottom: 8 }}
            defaultActiveKey={rules.length > 0 ? [rules[0].key] : []}
            accordion
          />
        ) : (
          <div
            style={{
              border: '1px dashed #d9d9d9',
              borderRadius: '6px',
              backgroundColor: '#fafafa',
              marginBottom: '8px',
            }}
          >
            <Empty description={t('No linkage rules')} style={{ margin: '20px 0' }} />
          </div>
        )}
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddRule} style={{ width: '100%' }}>
          {t('Add linkage rule')}
        </Button>
      </>
    );
  },
);

const commonLinkageRulesHandler = async (ctx: FlowContext, params: any) => {
  const evaluator = (path: string, operator: string, value: any) => {
    if (!operator) {
      return true;
    }
    return ctx.app.jsonLogic.apply({ [operator]: [path, value] });
  };

  const linkageRules: LinkageRule[] = params.value as LinkageRule[];
  const allModels: FlowModel[] = ctx.model.__allModels || (ctx.model.__allModels = []);
  const directValuePatches: Array<{ path: any; value: any }> = [];
  const rootCollection = getCollectionFromModel((ctx.model as any)?.context?.blockModel ?? ctx.model);
  const isSafeToWriteAssociationSubpath = (namePath: any): boolean => {
    if (!Array.isArray(namePath) || !namePath.length) return true;
    if (!rootCollection?.getField) return true;

    let collection: any = rootCollection;
    for (let i = 0; i < namePath.length; i++) {
      const seg = namePath[i] as any;
      if (typeof seg === 'number') continue;
      if (typeof seg !== 'string') continue;

      const field = collection?.getField?.(seg);
      if (!field) continue;

      const isAssoc = !!field?.isAssociationField?.();
      const hasTarget = !!field?.targetCollection;
      const toMany = isToManyAssociationField(field);

      if (toMany && i + 1 < namePath.length) {
        const next = namePath[i + 1] as any;
        if (typeof next !== 'number') return false;
      }

      if (isAssoc && hasTarget) {
        collection = field.targetCollection;
      }
    }

    return true;
  };
  const resolveNamePathForPatch = (path: any): Array<string | number> | null => {
    if (!path) return null;
    if (Array.isArray(path)) {
      const ok = path.length && path.every((seg) => typeof seg === 'string' || typeof seg === 'number');
      return ok ? (path as Array<string | number>) : null;
    }
    if (typeof path !== 'string') return null;
    const fieldIndex = (ctx.model as any)?.context?.fieldIndex;
    return resolveDynamicNamePath(path, fieldIndex);
  };
  const addFormValuePatch = (patch: { path: any; value: any; whenEmpty?: boolean }) => {
    if (!patch) return;
    const path = (patch as any)?.path;
    if (!path) return;
    const resolvedPath = resolveNamePathForPatch(path);
    if (!resolvedPath) {
      console.warn('[linkageRules] Skip linkage assignment due to failed path resolution', {
        flowKey: ctx.flowKey,
        modelUid: ctx.model?.uid,
        attemptedPath: path,
      });
      return;
    }
    if (!isSafeToWriteAssociationSubpath(resolvedPath)) {
      console.warn('[linkageRules] Skip linkage assignment for to-many association subpath without row index', {
        flowKey: ctx.flowKey,
        modelUid: ctx.model?.uid,
        attemptedPath: path,
        resolvedPath,
      });
      return;
    }
    const whenEmpty = !!(patch as any)?.whenEmpty;
    try {
      const form = ctx.model?.context?.form;
      const current = form?.getFieldValue?.(resolvedPath);
      if (whenEmpty && typeof current !== 'undefined' && current !== null && current !== '') {
        return;
      }
      if (_.isEqual(current, (patch as any)?.value)) {
        return;
      }
    } catch {
      // ignore
    }

    directValuePatches.push({ path: resolvedPath, value: (patch as any)?.value });
  };

  const getModelTargetPathForPatch = (model: any): string | null => {
    if (!model || typeof model !== 'object') return null;
    try {
      const init = model?.getStepParams?.('fieldSettings', 'init') as any;
      const initFieldPath = typeof init?.fieldPath === 'string' ? init.fieldPath : '';
      const initAssocPath = typeof init?.associationPathName === 'string' ? init.associationPathName : '';

      const fieldPath = initFieldPath || (typeof model?.fieldPath === 'string' ? model.fieldPath : '');
      const assocPath =
        initAssocPath || (typeof model?.associationPathName === 'string' ? model.associationPathName : '');

      if (assocPath) {
        if (!fieldPath) return assocPath;
        if (fieldPath.startsWith(`${assocPath}.`)) return fieldPath;
        return `${assocPath}.${fieldPath}`;
      }
      if (fieldPath) return fieldPath;
    } catch {
      // ignore
    }

    const name = model?.props?.name;
    if (typeof name === 'string' && name) return name;
    if (Array.isArray(name) && name.length) {
      let out = '';
      for (const seg of name) {
        if (typeof seg === 'number') {
          out += `[${seg}]`;
          continue;
        }
        if (typeof seg !== 'string' || !seg) continue;
        if (!out) out = seg;
        else out += `.${seg}`;
      }
      return out || null;
    }

    return null;
  };

  allModels.forEach((model: any) => {
    // 重置临时属性
    model.__props = {};
  });

  // 1. 运行所有的联动规则
  for (const rule of linkageRules.filter((r) => r.enable)) {
    const { condition: conditions, actions } = rule;

    const matched = evaluateConditions(removeInvalidFilterItems(conditions), evaluator);
    if (!matched) continue;

    for (const action of actions) {
      const setProps = (
        model: FlowModel & { __originalProps?: any; __props?: any; __shouldReset?: boolean },
        props: any,
      ) => {
        // 存储原始值，用于恢复
        if (!model.__originalProps) {
          model.__originalProps = {
            hiddenModel: model.hidden,
            hiddenText: undefined,
            disabled: undefined,
            required: undefined,
            hidden: undefined,
            ...model.props,
          };
        }

        if (!model.__props) {
          model.__props = {};
        }

        // 临时存起来，遍历完所有规则后，再统一处理
        model.__props = {
          ...model.__props,
          ...props,
        };

        if (allModels.indexOf(model) === -1) {
          allModels.push(model);
        }
      };

      // TODO: 需要改成 runAction 的写法。但 runAction 是异步的，用在这里会不符合预期。后面需要解决这个问题
      await ctx.getAction(action.name)?.handler(ctx, { ...action.params, setProps, addFormValuePatch });
    }
  }

  // 2. 合并去重（按 uid）后再实际更改相关 model 的状态，避免重复项把“已设置的临时属性”覆盖掉
  const mergedByUid = new Map<
    string,
    FlowModel & { __originalProps?: any; __props?: any; isFork?: boolean; forkId?: number }
  >();
  const mergedPropsByUid = new Map<string, any>();

  allModels.forEach((m: any) => {
    const uid = m?.uid || String(m);
    const curProps = m.__props || {};
    if (!mergedByUid.has(uid)) {
      mergedByUid.set(uid, m);
      mergedPropsByUid.set(uid, { ...curProps });
    } else {
      // 合并属性：后写覆盖先写；优先选择 fork 模型作为应用目标
      mergedPropsByUid.set(uid, { ...mergedPropsByUid.get(uid), ...curProps });
      const exist = mergedByUid.get(uid) as any;
      if (m.isFork && !exist.isFork) {
        mergedByUid.set(uid, m);
      }
    }
  });

  mergedByUid.forEach((model: any, uid) => {
    const patchProps = mergedPropsByUid.get(uid) || {};
    const newProps = { ...model.__originalProps, ...patchProps };

    model.setProps(_.omit(newProps, ['hiddenModel', 'value', 'hiddenText']));
    model.hidden = !!newProps.hiddenModel;

    if (newProps.required === true) {
      const rules = (model.props.rules || []).filter((rule) => !rule.required);
      rules.push({
        required: true,
        message: ctx.t('The field value is required'),
      });
      model.setProps('rules', rules);
    } else if (newProps.required === false) {
      const rules = (model.props.rules || []).filter((rule) => !rule.required);
      model.setProps('rules', rules);
    }

    if (newProps.hiddenText) {
      model.setProps('title', '');
    }

    // 目前只有表单的“字段赋值”有 value 属性
    if ('value' in newProps && model.context.form) {
      const targetPath = getModelTargetPathForPatch(model);
      if (!targetPath) {
        console.warn('[linkageRules] Skip linkage assignment due to missing target path', {
          flowKey: ctx.flowKey,
          modelUid: ctx.model?.uid,
          targetUid: model?.uid,
        });
      } else {
        addFormValuePatch({ path: targetPath, value: newProps.value });
      }
    }

    model.__props = null;
  });

  const allPatches = [...directValuePatches];
  if (!allPatches.length) return;

  const directCtx = ctx as any;
  const directSetter = directCtx?.setFormValues;
  const blockCtx = (ctx.model as any)?.context?.blockModel?.context;
  const blockSetter = blockCtx?.setFormValues;
  const rawInputArgs = directCtx?.inputArgs as any;
  const linkageTxId =
    typeof rawInputArgs?.linkageTxId === 'string' && rawInputArgs.linkageTxId
      ? rawInputArgs.linkageTxId
      : typeof rawInputArgs?.txId === 'string'
        ? rawInputArgs.txId
        : undefined;
  const linkageScopeDepth = getLinkageScopeDepthFromContext(ctx);

  const trySetFormValues = async (fn: any, thisArg: any, source: string) => {
    await fn.call(thisArg, allPatches, {
      source,
      linkageTxId,
      linkageScopeDepth,
    });
  };

  if (typeof directSetter === 'function') {
    try {
      await trySetFormValues(directSetter, directCtx, 'linkage');
      return;
    } catch (error) {
      console.warn('[linkageRules] Failed to set form values via setFormValues', {
        flowKey: ctx.flowKey,
        modelUid: (ctx.model as any)?.uid,
        setter: 'ctx',
        patchCount: allPatches.length,
        patches: allPatches.slice(0, 10).map((p) => ({ path: p.path, value: previewValueForLog(p.value) })),
      });
      console.warn(error);
    }
  }

  if (typeof blockSetter === 'function') {
    try {
      await trySetFormValues(blockSetter, blockCtx, 'linkage');
      return;
    } catch (error) {
      console.warn('[linkageRules] Failed to set form values via setFormValues', {
        flowKey: ctx.flowKey,
        modelUid: (ctx.model as any)?.uid,
        setter: 'blockModel',
        patchCount: allPatches.length,
        patches: allPatches.slice(0, 10).map((p) => ({ path: p.path, value: previewValueForLog(p.value) })),
      });
      console.warn(error);
    }
  }

  // 最后兜底：无 setFormValues（非表单 block scope）或 setFormValues 失败时直接写入 antd form。
  // 注意：antd form 可能已被 FormValueRuntime patch；此处不要再手动触发 formValuesChange 以避免自触发循环。
  allPatches.forEach(({ path, value }) => {
    try {
      const form = ctx.model?.context?.form;
      if (typeof form?.getFieldValue === 'function') {
        const prev = form.getFieldValue(path);
        if (_.isEqual(prev, value)) {
          return;
        }
      }
      form?.setFieldValue?.(path, value);
    } catch (error) {
      console.warn('[linkageRules] Failed to set form field value (fallback setFieldValue)', { path }, error);
    }
  });
};

export const blockLinkageRules = defineAction({
  name: 'blockLinkageRules',
  title: tExpr('Block linkage rules'),
  uiMode: 'embed',
  uiSchema(ctx) {
    return {
      value: {
        type: 'array',
        'x-component': LinkageRulesUI,
        'x-component-props': {
          supportedActions: getSupportedActions(ctx, ActionScene.BLOCK_LINKAGE_RULES),
          title: tExpr('Block linkage rules'),
        },
      },
    };
  },
  defaultParams: {
    value: [],
  },
  useRawParams: true,
  handler: async (ctx, params) => {
    const resolved = await resolveLinkageRulesParamsPreservingRunJsScripts(ctx, params);
    return commonLinkageRulesHandler(ctx, resolved);
  },
});

export const actionLinkageRules = defineAction({
  name: 'actionLinkageRules',
  title: tExpr('Linkage rules'),
  uiMode: 'embed',
  uiSchema(ctx) {
    return {
      value: {
        type: 'array',
        'x-component': LinkageRulesUI,
        'x-component-props': {
          supportedActions: getSupportedActions(ctx, ActionScene.ACTION_LINKAGE_RULES),
          title: tExpr('Linkage rules'),
        },
      },
    };
  },
  defaultParams: {
    value: [],
  },
  useRawParams: true,
  handler: async (ctx, params) => {
    const resolved = await resolveLinkageRulesParamsPreservingRunJsScripts(ctx, params);
    return commonLinkageRulesHandler(ctx, resolved);
  },
});

export const fieldLinkageRules = defineAction({
  name: 'fieldLinkageRules',
  title: tExpr('Field linkage rules'),
  uiMode: 'embed',
  uiSchema(ctx) {
    return {
      value: {
        type: 'array',
        'x-component': LinkageRulesUI,
        'x-component-props': {
          supportedActions: getSupportedActions(ctx, ActionScene.FIELD_LINKAGE_RULES),
          title: tExpr('Field linkage rules'),
        },
      },
    };
  },
  defaultParams: {
    value: [],
  },
  useRawParams: true,
  handler: async (ctx, params) => {
    if (ctx.model.hidden) {
      return;
    }

    const rootLinkageScopeDepth = 0;
    const defineSharedRuntimeMeta = (targetCtx: any) => {
      if (!targetCtx || typeof targetCtx.defineProperty !== 'function') return;
      const inputArgs = (ctx as any)?.inputArgs;
      if (inputArgs && typeof inputArgs === 'object') {
        targetCtx.defineProperty('inputArgs', {
          value: {
            ...inputArgs,
          },
        });
      }
      targetCtx.defineProperty('linkageScopeDepth', {
        value: rootLinkageScopeDepth,
      });
    };

    defineSharedRuntimeMeta(ctx as any);

    const rootCollection = getCollectionFromModel((ctx.model as any)?.context?.blockModel ?? ctx.model);
    const getRowScopeKeyForTargetPath = (targetPath: string): string | null => {
      if (!rootCollection?.getField) return null;
      const segs = parsePathString(String(targetPath || '')).filter((seg) => typeof seg !== 'object');
      if (segs.length < 2) return null;
      let collection: any = rootCollection;
      const toManyChain: string[] = [];
      for (let i = 0; i < segs.length - 1; i++) {
        const seg = segs[i];
        if (typeof seg !== 'string') continue;
        const field = collection?.getField?.(seg);
        if (!field?.isAssociationField?.()) break;
        const toMany = isToManyAssociationField(field);
        if (toMany) toManyChain.push(seg);
        if (toMany) {
          const next = segs[i + 1] as any;
          if (typeof next === 'number') {
            i += 1;
          }
        }
        collection = field?.targetCollection;
        if (!collection?.getField) break;
      }
      if (!toManyChain.length) return null;
      const deepest = toManyChain[toManyChain.length - 1];
      const occurrence = toManyChain.filter((n) => n === deepest).length;
      return `${deepest}#${occurrence}`;
    };

    const requiresRowIndexForTargetPath = (targetPath: string): boolean => {
      if (!rootCollection?.getField) return false;
      const segs = parsePathString(String(targetPath || '')).filter((seg) => typeof seg !== 'object');
      if (segs.length < 2) return false;
      let collection: any = rootCollection;
      for (let i = 0; i < segs.length - 1; i++) {
        const seg = segs[i];
        if (typeof seg !== 'string') continue;
        const field = collection?.getField?.(seg);
        if (!field?.isAssociationField?.()) break;
        const toMany = isToManyAssociationField(field);
        if (toMany) {
          const next = segs[i + 1] as any;
          if (typeof next !== 'number') return true;
          i += 1;
        }
        collection = field?.targetCollection;
        if (!collection?.getField) break;
      }
      return false;
    };

    const legacyTargetPathResolver = createLegacyTargetPathResolver(ctx);
    const splitParams = () => {
      const rawRules = params?.value;
      if (!Array.isArray(rawRules) || !rawRules.length) {
        return { blockParams: params, rowParamsByKey: new Map<string, any>() };
      }

      const blockRules: any[] = [];
      const rowRulesByKey = new Map<string, any[]>();

      const addRowRule = (rowKey: string, baseRule: any, actions: any[]) => {
        if (!rowKey || !actions.length) return;
        const arr = rowRulesByKey.get(rowKey) || [];
        arr.push({ ...baseRule, actions });
        rowRulesByKey.set(rowKey, arr);
      };

      for (const rule of rawRules) {
        if (!rule || typeof rule !== 'object') continue;
        const baseRule = {
          key: (rule as any).key,
          title: (rule as any).title,
          enable: (rule as any).enable,
          condition: (rule as any).condition,
        };
        const actions = Array.isArray((rule as any).actions) ? ((rule as any).actions as any[]) : [];

        const blockActions: any[] = [];
        const rowActionsByKey = new Map<string, any[]>();

        for (const action of actions) {
          const actionName = (action as any)?.name;
          const actionParams = (action as any)?.params;
          const rawValue = actionParams?.value;

          const splitAssignAction = (legacy: {
            mode: 'default' | 'assign';
            valueKey: 'assignValue' | 'initialValue';
          }) => {
            const items = normalizeAssignRuleItemsFromLinkageParams(rawValue, legacy, legacyTargetPathResolver);
            if (!items.length) return { block: null as any, rows: new Map<string, any>() };

            const blockItems: any[] = [];
            const rowItemsByKey = new Map<string, any[]>();

            for (const it of items) {
              const targetPath = it?.targetPath ? String(it.targetPath) : '';
              if (!targetPath) {
                blockItems.push(it);
                continue;
              }

              const rowScopeKey = getRowScopeKeyForTargetPath(targetPath);
              if (rowScopeKey && requiresRowIndexForTargetPath(targetPath)) {
                const arr = rowItemsByKey.get(rowScopeKey) || [];
                arr.push(it);
                rowItemsByKey.set(rowScopeKey, arr);
              } else {
                blockItems.push(it);
              }
            }

            const blockAction =
              blockItems.length > 0
                ? {
                    ...action,
                    params: { ...actionParams, value: blockItems },
                  }
                : null;

            const rowActions = new Map<string, any>();
            for (const [rowScopeKey, rowItems] of rowItemsByKey.entries()) {
              if (!rowItems.length) continue;
              rowActions.set(rowScopeKey, {
                ...action,
                params: { ...actionParams, value: rowItems },
              });
            }

            return { block: blockAction, rows: rowActions };
          };

          if (actionName === 'linkageAssignField') {
            const split = splitAssignAction({ mode: 'assign', valueKey: 'assignValue' });
            if (split.block) blockActions.push(split.block);
            split.rows.forEach((a, rowKey) => {
              const arr = rowActionsByKey.get(rowKey) || [];
              arr.push(a);
              rowActionsByKey.set(rowKey, arr);
            });
            continue;
          }

          if (actionName === 'setFieldsDefaultValue') {
            const split = splitAssignAction({ mode: 'default', valueKey: 'initialValue' });
            if (split.block) blockActions.push(split.block);
            split.rows.forEach((a, rowKey) => {
              const arr = rowActionsByKey.get(rowKey) || [];
              arr.push(a);
              rowActionsByKey.set(rowKey, arr);
            });
            continue;
          }

          // other actions: run at block scope only
          blockActions.push(action);
        }

        if (blockActions.length) {
          blockRules.push({ ...baseRule, actions: blockActions });
        }

        rowActionsByKey.forEach((actionsForKey, rowKey) => {
          addRowRule(rowKey, baseRule, actionsForKey);
        });
      }

      const blockParams = { ...params, value: blockRules };
      const rowParamsByKey = new Map<string, any>();
      rowRulesByKey.forEach((rulesForKey, rowKey) => {
        rowParamsByKey.set(rowKey, { ...params, value: rulesForKey });
      });

      return { blockParams, rowParamsByKey };
    };

    const { blockParams, rowParamsByKey } = splitParams();

    const resolvedBlock = await resolveLinkageRulesParamsPreservingRunJsScripts(ctx, blockParams);
    await commonLinkageRulesHandler(ctx, resolvedBlock);

    if (!rowParamsByKey.size) {
      return;
    }

    const getRowScopeKeyFromModel = (model: any): string | null => {
      const fieldIndex = model?.context?.fieldIndex;
      const arr = Array.isArray(fieldIndex) ? fieldIndex : [];
      if (!arr.length) return null;
      const entries: Array<{ name: string; index: number }> = [];
      for (const it of arr) {
        if (typeof it !== 'string') continue;
        const [name, indexStr] = it.split(':');
        const index = Number(indexStr);
        if (!name || Number.isNaN(index)) continue;
        entries.push({ name, index });
      }
      if (!entries.length) return null;
      const deepest = entries[entries.length - 1].name;
      const occurrence = entries.reduce((count, e) => (e.name === deepest ? count + 1 : count), 0);
      return `${deepest}#${occurrence}`;
    };

    const isRowGridForkModel = (model: any): boolean => {
      if (!model || typeof model !== 'object') return false;
      if ((model as any)?.subModels?.field) return false;
      if (!(model as any)?.subModels?.items) return false;
      return !!getRowScopeKeyFromModel(model);
    };

    const collectRowGridForksByKey = (): Map<string, FlowModel[]> => {
      const out = new Map<string, FlowModel[]>();
      const engine = ctx.engine;
      if (!engine?.forEachModel) return out;

      engine.forEachModel((m: FlowModel) => {
        const forks: any = (m as any)?.forks;
        if (!forks || typeof forks.forEach !== 'function') return;
        forks.forEach((fork: any) => {
          if (!fork || fork.disposed) return;
          if (!isRowGridForkModel(fork)) return;
          const rowScopeKey = getRowScopeKeyFromModel(fork);
          if (!rowScopeKey) return;
          const arr = out.get(rowScopeKey) || [];
          arr.push(fork as FlowModel);
          out.set(rowScopeKey, arr);
        });
      });

      return out;
    };

    const runRowScoped = async (): Promise<boolean> => {
      const forksByKey = collectRowGridForksByKey();
      let hasAnyRowFork = false;
      for (const [rowScopeKey, rowParams] of rowParamsByKey.entries()) {
        const forks = forksByKey.get(rowScopeKey) || [];
        if (forks.length) hasAnyRowFork = true;
        if (!forks.length) continue;
        for (const forkModel of forks) {
          const rowCtx = new FlowRuntimeContext(forkModel, ctx.flowKey);
          defineSharedRuntimeMeta(rowCtx as any);
          try {
            const resolvedRow = await resolveLinkageRulesParamsPreservingRunJsScripts(rowCtx, rowParams);
            await commonLinkageRulesHandler(rowCtx, resolvedRow);
          } catch (error) {
            console.warn('[linkageRules] Failed to run row-scoped linkage rules', {
              flowKey: ctx.flowKey,
              modelUid: ctx.model?.uid,
              rowScopeKey,
              forkUid: forkModel?.uid,
            });
            console.warn(error);
          }
        }
      }
      return hasAnyRowFork;
    };

    const hasAnyRowFork = await runRowScoped();

    // 如果当前未找到任何 row fork，但存在需要 row 上下文的赋值规则，延迟一帧再跑一次（解决 add 新行时 fork 尚未创建的问题）
    if (!hasAnyRowFork) {
      const flagKey = '__pendingLinkageRowScopedRetry__';
      const anyModel = ctx.model as any;
      if (!anyModel?.[flagKey]) {
        console.warn('[linkageRules] Row-scoped linkage assignment deferred (row forks not ready), will retry', {
          flowKey: ctx.flowKey,
          modelUid: (ctx.model as any)?.uid,
          rowKeys: Array.from(rowParamsByKey.keys()),
        });
        anyModel[flagKey] = true;
        setTimeout(() => {
          anyModel[flagKey] = false;
          const base = ctx.model as any;
          if (!base || base.disposed) return;
          void runRowScoped().catch((error) => {
            console.warn('[linkageRules] Failed to retry row-scoped linkage rules', error);
          });
        }, 0);
      }
    }
  },
});

export const subFormFieldLinkageRules = defineAction({
  name: 'subFormFieldLinkageRules',
  title: tExpr('Field linkage rules'),
  uiMode: 'embed',
  uiSchema(ctx) {
    return {
      value: {
        type: 'array',
        'x-component': LinkageRulesUI,
        'x-component-props': {
          supportedActions: getSupportedActions(ctx, ActionScene.SUB_FORM_FIELD_LINKAGE_RULES),
          title: tExpr('Field linkage rules'),
        },
      },
    };
  },
  defaultParams: {
    value: [],
  },
  useRawParams: true,
  handler: async (ctx, params) => {
    if (ctx.model.hidden) {
      return;
    }
    const grid = ctx.model?.subModels?.grid;
    if (!grid) {
      console.warn('[subFormFieldLinkageRules] Missing subModels.grid', {
        flowKey: ctx.flowKey,
        modelUid: ctx.model?.uid,
      });
      return;
    }

    const linkageScopeDepth = getLinkageScopeDepthFromModel((ctx as any)?.model);

    const createScopedFlowContext = (model: FlowModel) => {
      const flowContext = new FlowRuntimeContext(model, ctx.flowKey);
      const inputArgs = (ctx as any)?.inputArgs;
      if (inputArgs && typeof inputArgs === 'object') {
        flowContext.defineProperty('inputArgs', {
          value: {
            ...inputArgs,
          },
        });
      }
      flowContext.defineProperty('linkageScopeDepth', {
        value: linkageScopeDepth,
      });
      return flowContext;
    };

    // 适配对一子表单的场景
    if (ctx.model instanceof SubFormFieldModel) {
      if (grid.hidden) {
        return;
      }
      const flowContext = createScopedFlowContext(grid);
      try {
        const resolved = await resolveLinkageRulesParamsPreservingRunJsScripts(flowContext, params);
        await commonLinkageRulesHandler(flowContext, resolved);
      } catch (error) {
        console.warn('[subFormFieldLinkageRules] Failed to run linkage rules (to-one)', {
          flowKey: ctx.flowKey,
          modelUid: ctx.model?.uid,
          gridUid: grid?.uid,
        });
        console.warn(error);
      }
    } else {
      await Promise.all(
        (grid.forks || []).map(async (forkModel: FlowModel) => {
          if (forkModel.hidden) {
            return;
          }
          const flowContext = createScopedFlowContext(forkModel);
          try {
            const resolved = await resolveLinkageRulesParamsPreservingRunJsScripts(flowContext, params);
            await commonLinkageRulesHandler(flowContext, resolved);
          } catch (error) {
            console.warn('[subFormFieldLinkageRules] Failed to run linkage rules for fork', {
              flowKey: ctx.flowKey,
              modelUid: ctx.model?.uid,
              forkUid: forkModel?.uid,
              gridUid: grid?.uid,
            });
            console.warn(error);
          }
        }),
      );
    }
  },
});

export const detailsFieldLinkageRules = defineAction({
  name: 'detailsFieldLinkageRules',
  title: tExpr('Field linkage rules'),
  uiMode: 'embed',
  uiSchema(ctx) {
    return {
      value: {
        type: 'array',
        'x-component': LinkageRulesUI,
        'x-component-props': {
          supportedActions: getSupportedActions(ctx, ActionScene.DETAILS_FIELD_LINKAGE_RULES),
          title: tExpr('Field linkage rules'),
        },
      },
    };
  },
  defaultParams: {
    value: [],
  },
  useRawParams: true,
  handler: async (ctx, params) => {
    if (ctx.model.hidden) {
      return;
    }
    const resolved = await resolveLinkageRulesParamsPreservingRunJsScripts(ctx, params);
    return commonLinkageRulesHandler(ctx, resolved);
  },
});

function getSupportedActions(ctx: FlowContext, scene: ActionScene) {
  const result = [...ctx.getActions().values()]
    .filter((action) => {
      let scenes = action.scene;
      if (!scenes) {
        return false;
      }

      if (!Array.isArray(scenes)) {
        scenes = [scenes];
      }

      return scenes.includes(scene);
    })
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((action) => action.name);

  return result;
}
