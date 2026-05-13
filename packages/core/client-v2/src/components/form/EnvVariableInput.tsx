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
import { Input } from 'antd';
import React, { useMemo } from 'react';

const ENV_EXPR_REGEXP = /\{\{\s*(\$env\.[^{}]+?)\s*\}\}/g;
const ENV_SINGLE_EXPR_REGEXP = /^\{\{\s*(\$env\.[^{}]+?)\s*\}\}$/;
const META_TREE_CACHE_KEY = '@nocobase/client-v2:EnvVariableInput:metaTree';

/**
 * Convert a stored value like `"{{ $env.foo.bar }}"` back into the
 * `[$env, foo, bar]` path used by the variable picker.
 */
export function parseEnvPath(value?: string): string[] | undefined {
  const matched = value?.trim().match(ENV_SINGLE_EXPR_REGEXP);
  return matched?.[1] ? matched[1].split('.') : undefined;
}

/**
 * Format a meta tree node back into a `"{{ $env.x.y }}"` server-compatible
 * expression. Used as the `formatPathToValue` converter so the picker output
 * survives a round trip through the API.
 */
export function formatEnvPath(meta?: MetaTreeNode) {
  const paths = meta?.paths || [];
  if (paths[0] !== '$env' || paths.length < 2) {
    return undefined;
  }
  return `{{ ${paths.join('.')} }}`;
}

/**
 * Pull the `$env` sub-tree off the FlowContext meta registry and eagerly
 * resolve lazy `children` thunks so the picker can render labels on first
 * paint. Empty tree (no env-variables plugin or no defined vars) yields `[]`.
 */
function useEnvMetaTree(): MetaTreeNode[] {
  const ctx = useFlowContext();
  const { data } = useRequest<MetaTreeNode[], []>(
    async () => {
      const tree = ctx.getPropertyMetaTree().filter((node) => node.name === '$env');
      for (const node of tree) {
        if (typeof node.children === 'function') {
          try {
            const resolved = await (node.children as () => Promise<MetaTreeNode[]>)();
            node.children = Array.isArray(resolved) ? resolved : [];
          } catch {
            node.children = [];
          }
        }
      }
      return tree.filter((node) => Array.isArray(node.children) && node.children.length > 0);
    },
    {
      cacheKey: META_TREE_CACHE_KEY,
      refreshOnWindowFocus: true,
    },
  );

  return data ?? [];
}

export interface EnvVariableInputProps {
  value?: string;
  onChange?: (value: string) => void;
  addonBefore?: React.ReactNode;
  disabled?: boolean;
  /**
   * When true, plain (non-variable) values are masked via `Input.Password`
   * so secret credentials are not displayed verbatim. Variable expressions
   * remain editable through the variable picker even in password mode.
   */
  password?: boolean;
  placeholder?: string;
}

const isVariableExpr = (value?: string) => typeof value === 'string' && /\{\{\s*[^{}]+?\s*\}\}/.test(value);

/**
 * Generic input component for fields that accept either a literal value or a
 * `{{ $env.X }}` reference. The `$env` namespace is wired through the
 * environment-variables plugin's `flowEngine.context.defineProperty('$env', ...)`
 * registration; this component is the single consumption point and degrades
 * gracefully to a plain text input when no env variables are defined.
 */
export function EnvVariableInput(props: EnvVariableInputProps) {
  const { password, ...rest } = props;
  const metaTree = useEnvMetaTree();

  const converters = useMemo<VariableHybridInputConverters>(
    () => ({
      formatPathToValue: formatEnvPath,
      parseValueToPath: parseEnvPath,
      variableRegExp: ENV_EXPR_REGEXP,
    }),
    [],
  );

  if (password && rest.value && !isVariableExpr(rest.value)) {
    return (
      <Input.Password
        disabled={rest.disabled}
        placeholder={rest.placeholder}
        value={rest.value}
        onChange={(event) => rest.onChange?.(event.target.value)}
        autoFocus
      />
    );
  }

  return <VariableHybridInput {...rest} converters={converters} metaTree={metaTree} />;
}
