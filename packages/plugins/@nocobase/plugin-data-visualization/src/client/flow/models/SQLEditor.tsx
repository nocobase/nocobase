/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { connect, mapProps } from '@formily/react';
import { CodeEditor, CodeEditorHandle } from '../components/CodeEditor';
import { FlowContextSelector, useFlowContext } from '@nocobase/flow-engine';

const SQLEditorBase: React.FC<any> = (props) => {
  const { value, onChange } = props;
  const editorRef = useRef<CodeEditorHandle>(null);
  const ctx = useFlowContext();

  return (
    <CodeEditor
      ref={editorRef}
      language="sql"
      value={value}
      onChange={onChange}
      rightExtra={
        <FlowContextSelector
          onChange={(val) => {
            if (!val) return;
            editorRef.current?.insertAtCursor(val);
          }}
          metaTree={() => ctx.getPropertyMetaTree()}
        />
      }
    />
  );
};

export const SQLEditor = connect(
  SQLEditorBase,
  mapProps((props) => ({
    value: props.value,
    onChange: props.onChange,
  })),
);
