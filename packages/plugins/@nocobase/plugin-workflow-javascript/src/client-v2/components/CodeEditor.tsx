/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { javascript } from '@codemirror/lang-javascript';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { theme } from 'antd';
import { css } from '@emotion/css';
import { basicSetup } from 'codemirror';
import React, { useEffect, useMemo, useRef } from 'react';

type CodeEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export default function CodeEditor({ value = '', onChange, disabled = false }: CodeEditorProps) {
  const { token } = theme.useToken();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const editableCompartmentRef = useRef(new Compartment());
  const readOnlyCompartmentRef = useRef(new Compartment());
  const themeCompartmentRef = useRef(new Compartment());
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  const wrapperClassName = useMemo(
    () => css`
      width: 100%;

      .cm-editor {
        width: 100%;
        min-height: calc(${token.controlHeight}px * 10);
        border: 1px solid ${token.colorBorder};
        border-radius: ${token.borderRadiusLG}px;
        overflow: hidden;
      }

      .cm-editor:hover {
        border-color: ${disabled ? token.colorBorder : token.colorPrimaryHover};
      }

      .cm-editor.cm-focused {
        border-color: ${disabled ? token.colorBorder : token.colorPrimary};
        outline: none;
      }

      .cm-editor,
      .cm-scroller {
        cursor: ${disabled ? 'not-allowed' : 'text'};
      }

      .cm-content {
        caret-color: ${disabled ? 'transparent' : 'auto'};
      }

      .cm-scroller {
        min-height: calc(${token.controlHeight}px * 10);
        font-family: ${token.fontFamilyCode};
        background-color: ${disabled ? token.colorBgContainerDisabled : token.colorBgContainer};
      }
    `,
    [disabled, token],
  );

  const editorTheme = useMemo(
    () =>
      EditorView.theme({
        '.cm-content': {
          fontFamily: token.fontFamilyCode,
          fontSize: `${token.fontSize}px`,
        },
        '.cm-scroller': {
          backgroundColor: disabled ? token.colorBgContainerDisabled : token.colorBgContainer,
        },
      }),
    [disabled, token.colorBgContainer, token.colorBgContainerDisabled, token.fontFamilyCode, token.fontSize],
  );

  useEffect(() => {
    if (!containerRef.current || editorRef.current) {
      return;
    }

    const editor = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          javascript(),
          editableCompartmentRef.current.of(EditorView.editable.of(!disabled)),
          readOnlyCompartmentRef.current.of(EditorState.readOnly.of(disabled)),
          themeCompartmentRef.current.of(editorTheme),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) {
              return;
            }
            onChangeRef.current?.(update.state.doc.toString());
          }),
        ],
      }),
      parent: containerRef.current,
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, [disabled, editorTheme, value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.dispatch({
      effects: [
        editableCompartmentRef.current.reconfigure(EditorView.editable.of(!disabled)),
        readOnlyCompartmentRef.current.reconfigure(EditorState.readOnly.of(disabled)),
        themeCompartmentRef.current.reconfigure(editorTheme),
      ],
    });
  }, [disabled, editorTheme]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const currentValue = editor.state.doc.toString();
    if (currentValue === value) {
      return;
    }

    editor.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: value,
      },
    });
  }, [value]);

  return <div ref={containerRef} className={wrapperClassName} aria-disabled={disabled} />;
}
