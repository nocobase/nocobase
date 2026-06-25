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
  loadMetaTreeChildren,
  useFlowContext,
  type ContextSelectorItem,
  type MetaTreeNode,
} from '@nocobase/flow-engine';
import { Button, Cascader, DatePicker, Input, InputNumber, Select, Space, Tag, theme, type CascaderProps } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import {
  makeFormatVariablePath,
  makeParseVariablePath,
  useFilteredMetaTree,
  type VariableDelimiters,
} from './VariableInput';

/**
 * Constant types this input can edit. Matches v1 `Variable.Input`
 * `useTypedConstant` minus `'null'` (handled by the dedicated `nullable` prop).
 * `'object'` renders an inline JSON editor (textarea).
 */
export type TypedConstantType = 'string' | 'number' | 'boolean' | 'date' | 'object';

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
   *
   * Ignored when `metaTree` is supplied (an explicit tree wins).
   */
  namespaces?: string[];
  /** Additional leaves appended to the picker after the namespace-filtered nodes. */
  extraNodes?: MetaTreeNode[];
  /**
   * Provide the variable tree explicitly instead of reading the global
   * FlowContext meta tree. When set, `namespaces`/`extraNodes` are ignored and
   * this tree is used verbatim — use for context-scoped variable sources that
   * are not part of the global registry (e.g. a workflow node's upstream
   * outputs). Lazy `children` thunks are resolved on demand as the user
   * expands the cascader.
   */
  metaTree?: MetaTreeNode[];
  /**
   * When true (default), the switcher exposes a `Null` option that resets the
   * value to `null`. When false, the value is constrained to one of the
   * allowed types or a variable reference.
   */
  nullable?: boolean;
  /**
   * Opt-in: when the incoming `value` is `undefined`, initialize the editor to
   * the first allowed constant type instead of rendering the null-mode
   * placeholder. `null` still keeps its explicit null semantics; only
   * `undefined` triggers this path.
   */
  defaultToFirstConstantTypeWhenUndefined?: boolean;
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
  object: 'JSON',
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
    case 'object':
      return {};
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
  if (typeof value === 'object') return { mode: 'object' };
  return { mode: 'string' };
}

const NULL_KEY = '__null__';
const CONST_KEY = '__const__';

interface SwitcherOption {
  value: string;
  label: React.ReactNode;
  isLeaf?: boolean;
  loading?: boolean;
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
    onJsonError?: (message: string | null) => void;
  },
): React.ReactNode {
  const { typedProps, disabled, placeholder, t, onJsonError } = options;
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
    case 'object':
      return (
        <JsonConstantEditor
          value={value}
          onChange={onChange}
          onError={onJsonError}
          disabled={disabled}
          typedProps={typedProps}
        />
      );
    default:
      return null;
  }
}

const jsonEditorClassName = css`
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 80%;
`;

/**
 * Inline JSON editor for the `'object'` constant type. Formily-free port of v1's
 * `Json` input (which used a Formily field for error feedback): keeps the raw
 * text as local draft state, parses on blur, and writes the parsed object up via
 * `onChange`. A parse error is reported up through `onError` (the raw
 * `JSON.parse` message, matching v1) so the parent can render it on its own row
 * below the input — keeping the textarea + switcher button row intact.
 */
function JsonConstantEditor({
  value,
  onChange,
  onError,
  disabled,
  typedProps,
}: {
  value: unknown;
  onChange?: (next: unknown) => void;
  onError?: (message: string | null) => void;
  disabled?: boolean;
  typedProps: Record<string, unknown>;
}) {
  const stringify = useCallback((v: unknown) => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return '';
    }
  }, []);

  const [text, setText] = useState<string>(() => stringify(value));
  const [hasError, setHasError] = useState(false);

  // Re-sync the draft when the external value changes (e.g. switching type).
  useEffect(() => {
    setText(stringify(value));
    setHasError(false);
    onError?.(null);
    // `onError` intentionally omitted — only resync on external value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, stringify]);

  // Validate as the user types (live red border + error row), mirroring v1's `Json` which calls `setFeedback` on every
  // change — not just on blur.
  const handleChange = useCallback(
    (raw: string) => {
      setText(raw);
      const trimmed = raw.trim();
      if (trimmed === '') {
        setHasError(false);
        onError?.(null);
        return;
      }
      try {
        JSON.parse(trimmed);
        setHasError(false);
        onError?.(null);
      } catch (err) {
        setHasError(true);
        onError?.((err as Error).message);
      }
    },
    [onError],
  );

  // Commit the parsed object up on blur (v1 emits the value on blur). A still-invalid value keeps its error and is not
  // emitted.
  const commit = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === '') {
        onChange?.(null);
        return;
      }
      try {
        onChange?.(JSON.parse(trimmed));
      } catch {
        /* error already shown live via handleChange */
      }
    },
    [onChange],
  );

  return (
    // No `autoSize` — it would disable the resize grip. Default to 2 rows (mirrors v1's `Json`) and let the user
    // drag-resize from the corner.
    <Input.TextArea
      className={jsonEditorClassName}
      value={text}
      onChange={(ev) => handleChange(ev.target.value)}
      onBlur={(ev) => commit(ev.target.value)}
      disabled={disabled}
      rows={2}
      status={hasError ? 'error' : undefined}
      {...typedProps}
    />
  );
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
    metaTree: metaTreeProp,
    nullable = true,
    defaultToFirstConstantTypeWhenUndefined = true,
    delimiters,
    disabled,
    placeholder,
    style,
    className,
  } = props;
  const ctx = useFlowContext();
  const t = useCallback((text: string): string => (typeof ctx?.t === 'function' ? ctx.t(text) : text), [ctx]);
  const { token } = theme.useToken();

  // An explicit `metaTree` wins over the global FlowContext tree. The hook is still called unconditionally (Rules of
  // Hooks); its result is simply unused when a tree is injected.
  const filteredMetaTree = useFilteredMetaTree({ namespaces, extraNodes });
  const metaTree = metaTreeProp ?? filteredMetaTree;

  const parseVariablePath = useMemo(() => makeParseVariablePath(delimiters), [delimiters]);
  const formatVariablePath = useMemo(() => makeFormatVariablePath(delimiters), [delimiters]);

  const normalizedTypes = useMemo(() => normalizeTypes(types), [types]);
  const defaultedValue = useMemo(() => {
    if (!defaultToFirstConstantTypeWhenUndefined || value !== undefined) {
      return undefined;
    }
    const firstType = normalizedTypes[0];
    return firstType ? defaultValueFor(firstType.type) : undefined;
  }, [defaultToFirstConstantTypeWhenUndefined, normalizedTypes, value]);
  const effectiveValue = value === undefined && defaultedValue !== undefined ? defaultedValue : value;
  const detected = useMemo(() => detectMode(effectiveValue, parseVariablePath), [effectiveValue, parseVariablePath]);

  useEffect(() => {
    if (value === undefined && defaultedValue !== undefined) {
      onChange?.(defaultedValue);
    }
  }, [defaultedValue, onChange, value]);

  // rc-cascader caches its options by *reference* (useEntities), so lazily filling a node's children in place is
  // invisible to it. We mirror `FlowContextSelector`: lazy `loadData` mutates the **meta tree** in place, bumps
  // `updateFlag`, and the options are rebuilt from scratch (fresh references) on every bump — forcing rc-cascader to
  // re-index the new column.
  const [updateFlag, setUpdateFlag] = useState(0);
  const triggerUpdate = useCallback(() => setUpdateFlag((prev) => prev + 1), []);

  const loadData = useCallback(
    (selectedOptions: SwitcherOption[]) => {
      const target = selectedOptions[selectedOptions.length - 1];
      // Only variable nodes lazy-load; the Null / Constant switcher entries never do.
      if (!target || target.value === NULL_KEY || target.value === CONST_KEY) {
        return;
      }
      const meta = target.meta;
      if (!meta) {
        return;
      }
      // Already-resolved children (array): nothing to fetch.
      if (Array.isArray(meta.children)) {
        return;
      }
      if (typeof meta.children !== 'function') {
        return;
      }
      target.loading = true;
      triggerUpdate();
      // `loadMetaTreeChildren` already swallows its own errors (returns []), so a bare chain is safe; `return`
      // satisfies the promise/catch-or-return rule.
      return loadMetaTreeChildren(meta)
        .then((childMetas) => {
          // Cache resolved children on the meta node; the options tree is then rebuilt from the mutated meta tree on
          // the next `updateFlag` bump.
          meta.children = childMetas;
        })
        .finally(() => {
          target.loading = false;
          triggerUpdate();
        });
    },
    [triggerUpdate],
  );

  const switcherOptions = useMemo<SwitcherOption[]>(() => {
    // `updateFlag` is read so this recomputes (with fresh option references) after a lazy load mutates the meta tree.
    void updateFlag;
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
    items.push(...buildContextSelectorItems(metaTree).map(fromContextItem));
    return items;
  }, [nullable, normalizedTypes, metaTree, updateFlag, t]);

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
    const first = normalizedTypes[0];
    if (first) {
      onChange?.(defaultValueFor(first.type));
      return;
    }
    if (nullable) {
      onChange?.(null);
    }
  }, [nullable, normalizedTypes, onChange]);

  const constantTypeForRendering: TypedConstantType = useMemo(() => {
    const m = detected.mode;
    if (m === 'string' || m === 'number' || m === 'boolean' || m === 'date' || m === 'object') return m;
    return normalizedTypes[0]?.type ?? 'string';
  }, [detected.mode, normalizedTypes]);

  const typedProps = useMemo(
    () => normalizedTypes.find((nt) => nt.type === constantTypeForRendering)?.props ?? {},
    [normalizedTypes, constantTypeForRendering],
  );

  const isVariable = detected.mode === 'variable';
  const isNull = detected.mode === 'null';

  const variableLabels = useMemo(() => {
    // `updateFlag` is read so this recomputes after the preload effect below resolves a lazy level in the tree (same
    // pattern as `switcherOptions`).
    void updateFlag;
    return isVariable && detected.variablePath ? resolveVariableLabels(detected.variablePath, metaTree) : [];
  }, [isVariable, detected.variablePath, metaTree, updateFlag]);

  const switcherValue = useMemo(() => {
    if (isVariable && detected.variablePath?.length) {
      return detected.variablePath;
    }
    if (isNull) {
      return [NULL_KEY];
    }
    return [CONST_KEY, constantTypeForRendering];
  }, [constantTypeForRendering, detected.variablePath, isNull, isVariable]);

  // Preload a saved variable's label path across lazy levels. `resolveVariableLabels` can only read already-loaded
  // `children`; when a saved reference points below a node whose children are still a lazy thunk (e.g. a relation field
  // that hasn't been expanded), the deep segments render as raw names. Walk the saved path on mount / value change,
  // resolving each lazy level in place (then bump `updateFlag` so the labels recompute). Mirrors v1 `Variable.Input`'s
  // preload effect.
  useEffect(() => {
    if (!isVariable || !detected.variablePath?.length) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      let nodes: MetaTreeNode[] | undefined = metaTree;
      let didLoad = false;
      for (const segment of detected.variablePath as string[]) {
        if (!nodes) {
          break;
        }
        const matched: MetaTreeNode | undefined = nodes.find((node) => node.name === segment);
        if (!matched) {
          break;
        }
        if (typeof matched.children === 'function') {
          const resolved = await loadMetaTreeChildren(matched);
          if (cancelled) {
            return;
          }
          matched.children = resolved;
          didLoad = true;
        }
        nodes = Array.isArray(matched.children) ? matched.children : undefined;
      }
      if (didLoad && !cancelled) {
        triggerUpdate();
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // `metaTree` identity is stable per structural change (see consumers); re-run when the saved path or the tree
    // changes.
  }, [isVariable, detected.variablePath, metaTree, triggerUpdate]);

  // JSON parse error from the object editor, rendered on its own row below the input (not squeezed into the compact
  // row). Cleared whenever the value is no longer an object literal.
  const [jsonError, setJsonError] = useState<string | null>(null);
  useEffect(() => {
    if (constantTypeForRendering !== 'object') setJsonError(null);
  }, [constantTypeForRendering]);

  const variableValueClassName = useMemo(
    () => css`
      &:hover .clear-button,
      &:focus-within .clear-button {
        visibility: visible;
        pointer-events: auto;
        opacity: 1;
      }

      .clear-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: ${token.fontSizeIcon}px;
        height: ${token.fontSizeIcon}px;
        padding: 0;
        color: ${token.colorTextQuaternary};
        background: transparent;
        cursor: pointer;
        visibility: hidden;
        pointer-events: none;
        opacity: 0;
        transition:
          visibility ${token.motionDurationMid} ease,
          color ${token.motionDurationMid} ease,
          opacity ${token.motionDurationSlow} ease;

        &:hover {
          color: ${token.colorTextTertiary};
          background: transparent;
        }
      }
    `,
    [token],
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Default `Space.Compact` (align-items: stretch) so the switcher button
          grows to the value component's height — its `height: auto` (below) lets
          a multi-line value (the JSON textarea) stretch the button to match,
          joined like v1 (which sets `.ant-btn { height: auto }` likewise). */}
      <Space.Compact style={{ display: 'flex', width: '100%', ...style }} className={className}>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {isVariable ? (
            <div
              className={variableValueClassName}
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
                  className="clear-button"
                  aria-label="icon-close"
                  onClick={onClearVariable}
                  icon={<CloseCircleFilled />}
                />
              ) : null}
            </div>
          ) : isNull ? (
            // v1 used the `placeholder` slot (not `value`) so the antd default placeholder colour applies — keeps the
            // field looking visibly empty/inactive rather than holding a real text value.
            <Input placeholder={`<${t('Null')}>`} readOnly disabled={disabled} style={{ width: '100%' }} />
          ) : (
            renderConstantEditor(constantTypeForRendering, effectiveValue, onChange, {
              typedProps,
              disabled,
              placeholder,
              t,
              onJsonError: setJsonError,
            })
          )}
        </div>
        <Cascader<SwitcherOption>
          options={switcherOptions}
          value={switcherValue}
          onChange={onSwitcherChange}
          loadData={loadData}
          disabled={disabled}
          changeOnSelect
        >
          <Button
            aria-label="variable-switcher"
            disabled={disabled}
            type={isVariable ? 'primary' : 'default'}
            style={{
              flexShrink: 0,
              // `height: auto` (instead of antd's fixed control height) lets the button stretch to the value
              // component's height under the compact row's default `align-items: stretch` — so it stays joined to a
              // tall JSON textarea. Mirrors v1's `.ant-btn { height: auto }`.
              height: 'auto',
              fontStyle: 'italic',
              fontFamily: '"New York", "Times New Roman", Times, serif',
            }}
          >
            x
          </Button>
        </Cascader>
      </Space.Compact>
      {jsonError ? (
        <div style={{ marginTop: token.marginXXS, color: token.colorError, fontSize: token.fontSizeSM }}>
          {jsonError}
        </div>
      ) : null}
    </div>
  );
}

export default TypedVariableInput;
