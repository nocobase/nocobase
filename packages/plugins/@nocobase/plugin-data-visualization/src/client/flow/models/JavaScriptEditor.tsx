/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { connect, mapProps } from '@formily/react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { useGlobalTheme } from '@nocobase/client';

interface JavaScriptEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const JavaScriptEditorComponent: React.FC<JavaScriptEditorProps> = ({ value = '{}', onChange }) => {
  const { isDarkTheme } = useGlobalTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>();
  const themeExtension = isDarkTheme ? oneDark : [];

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        themeExtension,
        javascript(),
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
  }, []);

  return <div ref={editorRef} />;
};

export const JavaScriptEditor = connect(
  JavaScriptEditorComponent,
  mapProps((props) => {
    return {
      value: props.value,
      onChange: props.onChange,
    };
  }),
);
