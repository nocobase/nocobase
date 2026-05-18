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
const VARIABLE_EXPR_RE = /^\{\{\s*(.+?)\s*\}\}$/;

export function parseVariablePath(value?: string): string[] | undefined {
  if (typeof value !== 'string') return undefined;
  const match = value.trim().match(VARIABLE_EXPR_RE);
  if (!match) return undefined;
  let pathString = match[1];
  // Backwards-compat: accept the legacy `ctx.` prefix so values produced by
  // pre-fix versions of the picker still resolve to a labelled pill.
  if (pathString === 'ctx') return [];
  if (pathString.startsWith('ctx.')) pathString = pathString.slice(4);
  return pathString.split('.');
}

export function formatVariablePath(meta?: MetaTreeNode): string | undefined {
  const paths = meta?.paths || [];
  if (paths.length === 0) return undefined;
  // No inner spaces — matches the v1 storage shape exactly so round-trips
  // through the API stay byte-stable.
  return `{{${paths.join('.')}}}`;
}

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
   */
  converters?: VariableHybridInputConverters;
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
  const { namespaces, extraNodes, converters, ...rest } = props;
  const metaTree = useFilteredMetaTree({ namespaces, extraNodes });
  const mergedConverters = useMemo<VariableHybridInputConverters>(
    () => ({
      formatPathToValue: formatVariablePath,
      parseValueToPath: parseVariablePath,
      ...converters,
    }),
    [converters],
  );
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
  const { namespaces, extraNodes, rows, maxRows, style, ...rest } = props;
  const metaTree = useFilteredMetaTree({ namespaces, extraNodes });
  const metaTreeGetter = useMemo(() => () => metaTree, [metaTree]);
  return (
    <TextAreaWithContextSelector
      {...rest}
      rows={rows}
      maxRows={maxRows}
      style={style}
      metaTree={metaTreeGetter}
      formatPathToValue={(meta) => formatVariablePath(meta) ?? ''}
    />
  );
}
