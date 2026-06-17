/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Input, theme } from 'antd';
import { TextAreaWithContextSelector } from '@nocobase/client-v2';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client-v2';

type SqlEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  unsafeInjection?: boolean;
};

function formatWorkflowPathToValue(item: MetaTreeNode) {
  const path = item.paths ?? [];
  return path.length ? `{{${path.join('.')}}}` : '';
}

export function SqlEditor(props: SqlEditorProps) {
  const { unsafeInjection, ...rest } = props;
  const { token } = theme.useToken();
  const variableOptions = useWorkflowVariableOptions();
  const metaTree = useMemo(() => () => variableOptions, [variableOptions]);
  const style = useMemo<React.CSSProperties>(() => ({ fontFamily: token.fontFamilyCode }), [token.fontFamilyCode]);

  if (unsafeInjection) {
    return (
      <TextAreaWithContextSelector
        {...rest}
        rows={20}
        maxRows={20}
        style={style}
        metaTree={metaTree}
        formatPathToValue={formatWorkflowPathToValue}
      />
    );
  }

  return <Input.TextArea {...rest} rows={20} style={style} />;
}
