/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MetaTreeNode, VariableHybridInputConverters } from '@nocobase/flow-engine';
import { Input } from 'antd';
import React, { useMemo } from 'react';
import { VariableInput } from './VariableInput';

const ENV_EXPR_REGEXP = /\{\{\s*(\$env\.[^{}]+?)\s*\}\}/g;
const ENV_SINGLE_EXPR_REGEXP = /^\{\{\s*(\$env\.[^{}]+?)\s*\}\}$/;
const ENV_NAMESPACES = ['$env'];

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
 * Convenience wrapper around `VariableInput` constrained to the `$env`
 * namespace, with optional password-input masking for plain values. Use for
 * fields that accept either a literal credential or a `{{ $env.X }}`
 * reference (S3 access keys, OAuth secrets, etc.). The `$env` tree is
 * provided by the environment-variables plugin's
 * `flowEngine.context.defineProperty('$env', ...)`; this component degrades
 * gracefully to an empty picker when no env variables are defined.
 */
export function EnvVariableInput(props: EnvVariableInputProps) {
  const { password, ...rest } = props;

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

  return <VariableInput {...rest} namespaces={ENV_NAMESPACES} converters={converters} />;
}
