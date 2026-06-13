/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useFlowContext,
  VariableHybridInput,
  type MetaTreeNode,
  type VariableHybridInputConverters,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import React, { useMemo } from 'react';
import { TextAreaWithContextSelector } from '../../flow/components/TextAreaWithContextSelector';

/**
 * The flow-engine defaults emit `{{ ctx.$X.Y }}` and only parse the same
 * shape back into a path — but NocoBase server templates (and v1 stored
 * values) use the bare `{{$X.Y}}` form without the `ctx.` prefix. These
 * converters keep the picker's output stable against v1 and let already-
 * stored values round-trip to a labelled pill instead of falling back to a
 * raw `{{…}}` literal.
 */

/**
 * Variable delimiters: opening + closing tokens. Default `['{{', '}}']`
 * matches NocoBase server template convention (Handlebars HTML-escaped
 * output). Pass `['{{{', '}}}']` to switch to Handlebars' raw/unescaped
 * form — required for fields whose content is rendered as HTML (e.g.
 * in-app message body) so the variable expansion bypasses HTML escaping.
 *
 * Restrict to literal-token pairs, since the regex builder escapes them
 * verbatim.
 */
export type VariableDelimiters = readonly [string, string];

const DEFAULT_DELIMITERS: VariableDelimiters = ['{{', '}}'];

function escapeForRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Factory: returns a `parseValueToPath` bound to the given delimiters.
 * Anchored (`^…$`) — only treats the whole input as a single variable
 * reference, matching the v1 single-line picker behaviour.
 */
export function makeParseVariablePath(delimiters: VariableDelimiters = DEFAULT_DELIMITERS) {
  const [open, close] = delimiters;
  const re = new RegExp(`^${escapeForRegExp(open)}\\s*(.+?)\\s*${escapeForRegExp(close)}$`);
  return (value?: string): string[] | undefined => {
    if (typeof value !== 'string') return undefined;
    const match = value.trim().match(re);
    if (!match) return undefined;
    let pathString = match[1];
    // Backwards-compat: accept the legacy `ctx.` prefix so values produced by
    // pre-fix versions of the picker still resolve to a labelled pill.
    if (pathString === 'ctx') return [];
    if (pathString.startsWith('ctx.')) pathString = pathString.slice(4);
    return pathString.split('.');
  };
}

/**
 * Factory: returns a `formatPathToValue` bound to the given delimiters.
 * No inner spaces — matches the v1 storage shape exactly so round-trips
 * through the API stay byte-stable.
 */
export function makeFormatVariablePath(delimiters: VariableDelimiters = DEFAULT_DELIMITERS) {
  const [open, close] = delimiters;
  return (meta?: MetaTreeNode): string | undefined => {
    const paths = meta?.paths || [];
    if (paths.length === 0) return undefined;
    return `${open}${paths.join('.')}${close}`;
  };
}

/**
 * Factory: returns a global regex matching every occurrence of the
 * variable token within a longer string. Used by `VariableHybridInput`
 * to render embedded variables as pills.
 */
export function makeVariableRegExp(delimiters: VariableDelimiters = DEFAULT_DELIMITERS): RegExp {
  const [open, close] = delimiters;
  return new RegExp(`${escapeForRegExp(open)}\\s*([^{}]+?)\\s*${escapeForRegExp(close)}`, 'g');
}

// Default exports — `{{ ... }}` for the most common case. Kept named so
// existing callers don't need to switch to the factory.
export const parseVariablePath = makeParseVariablePath();
export const formatVariablePath = makeFormatVariablePath();

const META_TREE_CACHE_PREFIX = '@nocobase/client-v2:VariableInput:metaTree';

/**
 * Resolve the meta tree the variable picker should expose. Filters the global
 * meta tree by `namespaces` (top-level property names like `'$env'`,
 * `'$user'`), appends `extraNodes`, and eagerly resolves any lazy `children`
 * thunks so labels render on first paint.
 *
 * Returns `[]` while loading or when no nodes survive the filter, mirroring
 * the existing EnvVariableInput behavior so the picker still opens but offers
 * nothing.
 */
export function useFilteredMetaTree(options: { namespaces?: string[]; extraNodes?: MetaTreeNode[] }): MetaTreeNode[] {
  const { namespaces, extraNodes } = options;
  const ctx = useFlowContext();
  const cacheKey = useMemo(() => {
    const ns = namespaces ? [...namespaces].sort().join(',') : '*';
    return `${META_TREE_CACHE_PREFIX}:${ns}`;
  }, [namespaces]);

  const { data } = useRequest<MetaTreeNode[], []>(
    async () => {
      const all = ctx.getPropertyMetaTree?.() ?? [];
      const filtered = namespaces ? all.filter((node) => namespaces.includes(node.name)) : all;
      for (const node of filtered) {
        if (typeof node.children === 'function') {
          try {
            const resolved = await (node.children as () => Promise<MetaTreeNode[]>)();
            node.children = Array.isArray(resolved) ? resolved : [];
          } catch {
            node.children = [];
          }
        }
      }
      const withChildren = filtered.filter(
        (node) => !Array.isArray(node.children) || node.children.length > 0 || node.type !== 'object',
      );
      return withChildren;
    },
    {
      cacheKey,
      refreshOnWindowFocus: true,
    },
  );

  return useMemo(() => {
    const base = data ?? [];
    if (!extraNodes?.length) return base;
    return [...base, ...extraNodes];
  }, [data, extraNodes]);
}

export interface VariableInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  addonBefore?: React.ReactNode;
  /**
   * Restrict the picker to specific top-level meta tree namespaces (e.g.
   * `['$env', '$user']`). When omitted, every registered top-level property is
   * exposed. Filter happens at the picker level — the underlying regex used
   * for pill rendering still matches any `{{ ... }}` expression so pre-existing
   * out-of-scope values stay legible.
   */
  namespaces?: string[];
  /**
   * Static leaves appended to the picker, after the namespace-filtered nodes.
   * Use for ad-hoc local-only variables (e.g. `$resetLink`) that are not part
   * of the global FlowContext registry.
   */
  extraNodes?: MetaTreeNode[];
  /**
   * Override the converters used by the underlying `VariableHybridInput`.
   * Mostly useful when the caller wants to constrain `formatPathToValue` to a
   * specific namespace (see `EnvVariableInput` for that pattern).
   *
   * Takes precedence over `delimiters` when both are set on the same field
   * (an explicit converter wins over the delimiter-derived one).
   */
  converters?: VariableHybridInputConverters;
  /**
   * Token pair wrapping variable references in the stored string. Defaults
   * to `['{{', '}}']` — the standard NocoBase server-template form,
   * HTML-escaped by Handlebars. Pass `['{{{', '}}}']` for fields rendered
   * as HTML where escaping would corrupt the variable value (e.g. the
   * in-app message body).
   *
   * Ignored when `converters` is also supplied — caller-provided converters
   * win.
   */
  delimiters?: VariableDelimiters;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Inline (single-line) variable input. Renders the literal text and any
 * `{{ ... }}` references as styled pills via `VariableHybridInput`. Use for
 * fields like form input titles, email subject lines, or any place a single
 * line of mixed literal+variable content is appropriate.
 */
export function VariableInput(props: VariableInputProps) {
  const { namespaces, extraNodes, converters, delimiters, ...rest } = props;
  const metaTree = useFilteredMetaTree({ namespaces, extraNodes });
  const mergedConverters = useMemo<VariableHybridInputConverters>(() => {
    // Default delimiters → reuse the pre-built singletons.
    if (!delimiters) {
      return {
        formatPathToValue: formatVariablePath,
        parseValueToPath: parseVariablePath,
        ...converters,
      };
    }
    return {
      formatPathToValue: makeFormatVariablePath(delimiters),
      parseValueToPath: makeParseVariablePath(delimiters),
      variableRegExp: makeVariableRegExp(delimiters),
      ...converters,
    };
  }, [converters, delimiters]);
  return <VariableHybridInput {...rest} converters={mergedConverters} metaTree={metaTree} />;
}

export interface VariableTextAreaProps extends Omit<VariableInputProps, 'converters' | 'addonBefore'> {
  rows?: number;
  maxRows?: number;
}

/**
 * Multi-line variable input. Variables are inserted as raw `{{ ... }}` text at
 * the caret rather than rendered as pills — use for email body templates and
 * other free-form long-form text where literal display of variable expressions
 * is desirable (the server expands them at render time).
 */
export function VariableTextArea(props: VariableTextAreaProps) {
  const { namespaces, extraNodes, rows, maxRows, style, delimiters, ...rest } = props;
  const metaTree = useFilteredMetaTree({ namespaces, extraNodes });
  const metaTreeGetter = useMemo(() => () => metaTree, [metaTree]);
  const formatPathToValue = useMemo(
    () => (delimiters ? makeFormatVariablePath(delimiters) : formatVariablePath),
    [delimiters],
  );
  return (
    <TextAreaWithContextSelector
      {...rest}
      rows={rows}
      maxRows={maxRows}
      style={style}
      metaTree={metaTreeGetter}
      formatPathToValue={(meta) => formatPathToValue(meta) ?? ''}
    />
  );
}
