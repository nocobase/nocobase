/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, StateEffect } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, CompletionSource } from '@codemirror/autocomplete';
import { useGlobalTheme } from '@nocobase/client';

const LANGUAGE_EXTENSIONS: Record<string, () => Promise<any>> = {
  javascript: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
};

const langCache = new Map<string, any>();

export interface CodeEditorProps {
  language?: string;
  value?: string;
  onChange?: (value: string) => void;
  completions?: CompletionSource | CompletionSource[];
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'javascript',
  value = '',
  onChange,
  completions,
}) => {
  const { isDarkTheme } = useGlobalTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>();
  const [langExt, setLangExt] = useState<any>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const autoCompletion = useMemo(() => {
    if (!completions) {
      return [];
    }

    const sources = Array.isArray(completions) ? completions : [completions];

    return autocompletion({
      override: sources,
    });
  }, [completions]);

  const createExtensions = useCallback(
    (langExtension: any, darkTheme: boolean) => [
      basicSetup,
      darkTheme ? oneDark : [],
      langExtension || [],
      autoCompletion,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChangeRef.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
    ],
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const loadLanguage = async () => {
      if (langCache.has(language) && !cancelled) {
        setLangExt(langCache.get(language));
        return;
      }

      const loader = LANGUAGE_EXTENSIONS[language];
      if (!loader && !cancelled) {
        setLangExt(null);
        return;
      }

      try {
        const ext = await loader();
        langCache.set(language, ext);
        if (!cancelled) {
          setLangExt(ext);
        }
      } catch (error) {
        console.warn(`Failed to load language extension for ${language}:`, error);
        if (!cancelled) {
          setLangExt(null);
        }
      }
    };

    loadLanguage();
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (!editorRef.current || langExt === undefined) {
      return;
    }

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChangeRef.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [basicSetup, isDarkTheme ? oneDark : [], langExt || [], updateListener],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = undefined;
    };
  }, [langExt, isDarkTheme]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !langExt) {
      return;
    }

    view.dispatch({
      effects: StateEffect.reconfigure.of(createExtensions(langExt, isDarkTheme)),
    });
  }, [langExt, isDarkTheme, createExtensions]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) {
      return;
    }

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: value,
      },
    });
  }, [value]);

  return <div ref={editorRef} />;
};
