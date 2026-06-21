/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { CompletionContext } from '@codemirror/autocomplete';

export const ChartOptionsEditor: React.FC<{
  value?: string;
  onChange?: (next: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}> = ({ value, onChange, ...rest }) => {
  // 保留原有补全提示
  const completions = (context: CompletionContext) => {
    const word = context.matchBefore(/\w*/);
    if (!word) return null;

    const { from, to } = word;
    return {
      from,
      to,
      options: [
        { label: 'ctx.data.objects', type: 'variable', info: 'Original data object' },
        { label: 'ctx.data.rows', type: 'variable', info: 'Data structured by row' },
        { label: 'ctx.data.columns', type: 'variable', info: 'Data structured by column' },
      ],
    };
  };

  return <CodeEditor value={value} onChange={onChange} language="javascript" completions={completions} {...rest} />;
};
