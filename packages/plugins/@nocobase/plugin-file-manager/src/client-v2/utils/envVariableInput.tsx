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
import { useT } from '../locale';

const ENV_EXPR_REGEXP = /\{\{\s*(\$env\.[^{}]+?)\s*\}\}/g;
const ENV_SINGLE_EXPR_REGEXP = /^\{\{\s*(\$env\.[^{}]+?)\s*\}\}$/;

export function parseEnvPath(value?: string): string[] | undefined {
  const matched = value?.trim().match(ENV_SINGLE_EXPR_REGEXP);
  return matched?.[1] ? matched[1].split('.') : undefined;
}

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
  password?: boolean;
  placeholder?: string;
}

const isVariableExpr = (value?: string) => typeof value === 'string' && /\{\{\s*[^{}]+?\s*\}\}/.test(value);

export function EnvVariableInput(props: EnvVariableInputProps) {
  const { password, ...rest } = props;
  const ctx = useFlowContext();
  const t = useT();
  const { data } = useRequest(
    async () => {
      try {
        const response = await ctx.api.request({
          url: 'environmentVariables?paginate=false',
          skipNotify: true,
        });
        return response?.data?.data || [];
      } catch {
        return [];
      }
    },
    {
      refreshDeps: [ctx.api],
    },
  );

  const metaTree = useMemo<MetaTreeNode[]>(() => {
    const children = (Array.isArray(data) ? data : []).map((item: any) => ({
      name: item.name,
      parentTitles: [t('Variables and secrets')],
      title: item.name,
      paths: ['$env', item.name],
      type: item.type || 'string',
    }));

    return children.length
      ? [
          {
            name: '$env',
            title: t('Variables and secrets'),
            paths: ['$env'],
            type: 'object',
            children,
          },
        ]
      : [];
  }, [data, t]);

  const converters = useMemo<VariableHybridInputConverters>(
    () => ({
      formatPathToValue: formatEnvPath,
      parseValueToPath: parseEnvPath,
      variableRegExp: ENV_EXPR_REGEXP,
    }),
    [],
  );

  // For password fields: when value is plain (not a variable expression),
  // render a masked Input.Password so secrets are not exposed; otherwise keep the variable editor.
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
