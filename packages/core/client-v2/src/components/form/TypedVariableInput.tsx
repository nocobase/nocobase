/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseCircleFilled } from '@ant-design/icons';
import {
  buildContextSelectorItems,
  useFlowContext,
  type ContextSelectorItem,
  type MetaTreeNode,
} from '@nocobase/flow-engine';
import { Button, Cascader, DatePicker, Input, InputNumber, Select, Space, Tag, theme, type CascaderProps } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useMemo } from 'react';
import {
  makeFormatVariablePath,
  makeParseVariablePath,
  useFilteredMetaTree,
  type VariableDelimiters,
} from './VariableInput';

/**
 * Constant types this input can edit. Subset of v1 `Variable.Input`
 * `useTypedConstant` — drops `'object'` (no v2 JSON editor yet) and `'null'`
 * (handled by the dedicated `nullable` prop).
 */
export type TypedConstantType = 'string' | 'number' | 'boolean' | 'date';

/**
 * One allowed constant type. Either a bare type name (`'number'`) or a
 * `[type, editorProps]` pair (`['number', { min: 1, max: 65535 }]`) where
 * `editorProps` is forwarded to the antd editor for that type — same
 * shape as v1 `useTypedConstant`.
 */
export type TypedConstantSpec = TypedConstantType | [TypedConstantType, Record<string, unknown>];

export interface TypedVariableInputProps {
  /**
   * Stored value. A `{{ ... }}` string is treated as a variable reference;
   * anything else is a constant of the inferred type.
   */
  value?: unknown;
  onChange?: (next: unknown) => void;
  /**
   * Allowed constant types. The `Constant` switcher entry always exposes a
   * typed submenu (matching v1 `Variable.Input`) so users can see what type
   * the constant is, even when only one type is permitted. Default: all four
   * supported types.
   */
  types?: TypedConstantSpec[];
  /**
   * Restrict the variable picker to specific top-level meta-tree namespaces
   * (e.g. `['$env']`). When omitted, every registered top-level property is
   * exposed — matching `VariableInput`'s default behaviour.
   */
  namespaces?: string[];
  /** Additional leaves appended to the picker after the namespace-filtered nodes. */
  extraNodes?: MetaTreeNode[];
  /**
   * When true (default), the switcher exposes a `Null` option that resets the
   * value to `null`. When false, the value is constrained to one of the
   * allowed types or a variable reference.
   */
  nullable?: boolean;
  /** Variable-token delimiters. Default `['{{', '}}']` — see `VariableInput`. */
  delimiters?: VariableDelimiters;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}

const DEFAULT_TYPES: TypedConstantSpec[] = ['string', 'number', 'boolean', 'date'];

const TYPE_LABEL_KEYS: Record<TypedConstantType, string> = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  date: 'Date',
};

type NormalizedType = { type: TypedConstantType; props: Record<string, unknown> };

function normalizeTypes(types: TypedConstantSpec[]): NormalizedType[] {
  return types.map((spec) =>
    Array.isArray(spec) ? { type: spec[0], props: spec[1] ?? {} } : { type: spec, props: {} },
  );
}

function defaultValueFor(type: TypedConstantType): unknown {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'date': {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    }
    default:
      return null;
  }
}

type DetectedMode = { mode: 'null' | 'variable' | TypedConstantType; variablePath?: string[] };

function detectMode(value: unknown, parseVariablePath: (v?: string) => string[] | undefined): DetectedMode {
  if (value == null) return { mode: 'null' };
  if (typeof value === 'string') {
    const path = parseVariablePath(value);
    if (path && path.length > 0) return { mode: 'variable', variablePath: path };
    return { mode: 'string' };
  }
  if (typeof value === 'number') return { mode: 'number' };
  if (typeof value === 'boolean') return { mode: 'boolean' };
  if (value instanceof Date) return { mode: 'date' };
  return { mode: 'string' };
}

const NULL_KEY = '__null__';
const CONST_KEY = '__const__';

interface SwitcherOption {
  value: string;
  label: React.ReactNode;
  isLeaf?: boolean;
  children?: SwitcherOption[];
  meta?: MetaTreeNode;
  paths?: string[];
  disabled?: boolean;
}

function fromContextItem(item: ContextSelectorItem): SwitcherOption {
  return {
    value: item.value,
    label: item.label,
    isLeaf: item.isLeaf,
    meta: item.meta,
    paths: item.paths,
    disabled: item.disabled,
    children: item.children?.map(fromContextItem),
  };
}

function resolveVariableLabels(path: string[], metaTree: MetaTreeNode[]): string[] {
  const labels: string[] = [];
  let nodes: MetaTreeNode[] | undefined = metaTree;
  for (const segment of path) {
    if (!nodes) break;
    const matched: MetaTreeNode | undefined = nodes.find((node) => node.name === segment);
    if (!matched) {
      labels.push(segment);
      nodes = undefined;
      continue;
    }
    labels.push(typeof matched.title === 'string' && matched.title ? matched.title : matched.name);
    nodes = Array.isArray(matched.children) ? matched.children : undefined;
  }
  return labels;
}

function renderConstantEditor(
  type: TypedConstantType,
  value: unknown,
  onChange: ((next: unknown) => void) | undefined,
  options: {
    typedProps: Record<string, unknown>;
    disabled?: boolean;
    placeholder?: string;
    t: (text: string) => string;
  },
): React.ReactNode {
  const { typedProps, disabled, placeholder, t } = options;
  switch (type) {
    case 'string':
      return (
        <Input
          value={typeof value === 'string' ? value : ''}
          onChange={(ev) => onChange?.(ev.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          {...typedProps}
        />
      );
    case 'number':
      return (
        <InputNumber
          value={typeof value === 'number' ? value : null}
          onChange={(next) => onChange?.(next)}
          disabled={disabled}
          placeholder={placeholder}
          style={{ width: '100%' }}
          {...typedProps}
        />
      );
    case 'boolean':
      return (
        <Select
          value={typeof value === 'boolean' ? value : undefined}
          onChange={(next) => onChange?.(next)}
          disabled={disabled}
          placeholder={placeholder ?? t('Select')}
          options={[
            { value: true, label: t('True') },
            { value: false, label: t('False') },
          ]}
          style={{ width: '100%' }}
          {...typedProps}
        />
      );
    case 'date': {
      const parsed = value instanceof Date ? dayjs(value) : null;
      return (
        <DatePicker
          value={parsed}
          onChange={(next) => onChange?.(next ? next.toDate() : null)}
          disabled={disabled}
          showTime
          allowClear={false}
          style={{ width: '100%' }}
          {...typedProps}
        />
      );
    }
    default:
      return null;
  }
}

/**
 * Constant-or-variable input. Port of v1 `Variable.Input` typed-constant
 * Cascader pattern (the `[Null | Constant<type> | Variable<…namespaces>]`
 * switcher). Use this when a field can accept either a typed literal
 * (number, boolean, date, string) or a variable reference like
 * `{{ $env.SMTP_PORT }}` — see `plugin-notification-email`'s port / secure
 * fields for the canonical example.
 *
 * Pure literal fields should keep using the antd primitive
 * (`InputNumber`, `Select`, `DatePicker`). Pure variable fields should keep
 * using `EnvVariableInput` / `VariableInput`. This component carries the
 * Cascader switcher overhead, so reach for it only when the field
 * genuinely accepts both shapes.
 */
export function TypedVariableInput(props: TypedVariableInputProps) {
  const {
    value,
    onChange,
    types = DEFAULT_TYPES,
    namespaces,
    extraNodes,
    nullable = true,
    delimiters,
    disabled,
    placeholder,
    style,
    className,
  } = props;
  const ctx = useFlowContext();
  const t = useCallback((text: string): string => (typeof ctx?.t === 'function' ? ctx.t(text) : text), [ctx]);
  const { token } = theme.useToken();

  const metaTree = useFilteredMetaTree({ namespaces, extraNodes });

  const parseVariablePath = useMemo(() => makeParseVariablePath(delimiters), [delimiters]);
  const formatVariablePath = useMemo(() => makeFormatVariablePath(delimiters), [delimiters]);

  const normalizedTypes = useMemo(() => normalizeTypes(types), [types]);
  const detected = useMemo(() => detectMode(value, parseVariablePath), [value, parseVariablePath]);
  const variableItems = useMemo(() => buildContextSelectorItems(metaTree).map(fromContextItem), [metaTree]);

  const switcherOptions = useMemo<SwitcherOption[]>(() => {
    const items: SwitcherOption[] = [];
    if (nullable) {
      items.push({ value: NULL_KEY, label: t('Null'), isLeaf: true });
    }
    // Always render Constant with a typed submenu — even when only one type is
    // allowed. Matches v1 `Variable.Input`, where clicking 常量 reveals 数字 /
    // 逻辑值 / etc. so the user can see what type the constant actually is.
    if (normalizedTypes.length > 0) {
      items.push({
        value: CONST_KEY,
        label: t('Constant'),
        children: normalizedTypes.map(({ type }) => ({
          value: type,
          label: t(TYPE_LABEL_KEYS[type]),
          isLeaf: true,
        })),
      });
    }
    items.push(...variableItems);
    return items;
  }, [nullable, normalizedTypes, variableItems, t]);

  const onSwitcherChange = useCallback<NonNullable<CascaderProps<SwitcherOption>['onChange']>>(
    (path, selectedOptions) => {
      const head = path?.[0];
      if (head === NULL_KEY) {
        onChange?.(null);
        return;
      }
      if (head === CONST_KEY) {
        // Cascader always emits the second segment now that we render typed
        // children even for single-type configs. Fall back to the first
        // allowed type so picking only the parent still does something
        // sensible (`changeOnSelect` lets this fire).
        const targetType = (path[1] as TypedConstantType | undefined) ?? normalizedTypes[0]?.type;
        if (!targetType) return;
        if (detected.mode === targetType) return;
        onChange?.(defaultValueFor(targetType));
        return;
      }
      const leaf = selectedOptions?.[selectedOptions.length - 1] as SwitcherOption | undefined;
      const meta = leaf?.meta;
      if (!meta) return;
      const formatted = formatVariablePath(meta);
      if (formatted != null) onChange?.(formatted);
    },
    [onChange, normalizedTypes, detected.mode, formatVariablePath],
  );

  const onClearVariable = useCallback(() => {
    if (nullable) {
      onChange?.(null);
      return;
    }
    const first = normalizedTypes[0];
    if (first) onChange?.(defaultValueFor(first.type));
  }, [nullable, normalizedTypes, onChange]);

  const constantTypeForRendering: TypedConstantType = useMemo(() => {
    const m = detected.mode;
    if (m === 'string' || m === 'number' || m === 'boolean' || m === 'date') return m;
    return normalizedTypes[0]?.type ?? 'string';
  }, [detected.mode, normalizedTypes]);

  const typedProps = useMemo(
    () => normalizedTypes.find((nt) => nt.type === constantTypeForRendering)?.props ?? {},
    [normalizedTypes, constantTypeForRendering],
  );

  const isVariable = detected.mode === 'variable';
  const isNull = detected.mode === 'null';

  const variableLabels = useMemo(
    () => (isVariable && detected.variablePath ? resolveVariableLabels(detected.variablePath, metaTree) : []),
    [isVariable, detected.variablePath, metaTree],
  );

  return (
    <Space.Compact style={{ display: 'flex', width: '100%', ...style }} className={className}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {isVariable ? (
          <div
            role="button"
            aria-label="variable-tag"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: token.marginXXS,
              padding: `0 ${token.paddingSM}px`,
              minHeight: token.controlHeight,
              border: `1px solid ${token.colorBorder}`,
              borderRadius: token.borderRadius,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              background: disabled ? token.colorBgContainerDisabled : token.colorBgContainer,
              overflow: 'hidden',
            }}
          >
            <Tag
              color="blue"
              style={{
                marginInlineEnd: 0,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {variableLabels.map((label, index) => (
                <React.Fragment key={`${label}-${index}`}>
                  {index ? ' / ' : ''}
                  {label}
                </React.Fragment>
              ))}
            </Tag>
            {!disabled ? (
              <Button
                type="text"
                size="small"
                aria-label="icon-close"
                onClick={onClearVariable}
                icon={<CloseCircleFilled style={{ color: token.colorTextTertiary }} />}
              />
            ) : null}
          </div>
        ) : isNull ? (
          // v1 used the `placeholder` slot (not `value`) so the antd default
          // placeholder colour applies — keeps the field looking visibly
          // empty/inactive rather than holding a real text value.
          <Input placeholder={`<${t('Null')}>`} readOnly disabled={disabled} style={{ width: '100%' }} />
        ) : (
          renderConstantEditor(constantTypeForRendering, value, onChange, {
            typedProps,
            disabled,
            placeholder,
            t,
          })
        )}
      </div>
      <Cascader<SwitcherOption>
        options={switcherOptions}
        onChange={onSwitcherChange}
        disabled={disabled}
        changeOnSelect
      >
        <Button
          aria-label="variable-switcher"
          disabled={disabled}
          type={isVariable ? 'primary' : 'default'}
          style={{
            flexShrink: 0,
            fontStyle: 'italic',
            fontFamily: '"New York", "Times New Roman", Times, serif',
          }}
        >
          x
        </Button>
      </Cascader>
    </Space.Compact>
  );
}

export default TypedVariableInput;
