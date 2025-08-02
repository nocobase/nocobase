/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { connect, mapProps } from '@formily/react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { useGlobalTheme } from '@nocobase/client';

interface SQLEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const SQLEditorComponent: React.FC<SQLEditorProps> = ({ value = '', onChange }) => {
  const { isDarkTheme } = useGlobalTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>();
  const themeExtension = useMemo(() => (isDarkTheme ? oneDark : []), [isDarkTheme]);

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        themeExtension,
        sql(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && onChange) {
            const doc = update.state.doc;
            onChange(doc.toString());
          }
        }),
      ],
    });

    viewRef.current = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
    };
  }, [onChange, themeExtension]);

  return <div ref={editorRef} />;
};

export const SQLEditor = connect(
  SQLEditorComponent,
  mapProps((props) => {
    return {
      value: props.value,
      onChange: props.onChange,
    };
  }),
);
