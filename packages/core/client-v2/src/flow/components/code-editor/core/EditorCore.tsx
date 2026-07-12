/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { autocompletion, type Completion, type CompletionSource } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { EditorView, placeholder as cmPlaceholder, tooltips } from '@codemirror/view';
import { javascriptWithHtmlTemplates } from '../javascriptHtmlTemplate';
import { createHtmlCompletion } from '../htmlCompletion';
import { createJsxCompletion } from '../jsxCompletion';
import { createJavaScriptLinter } from '../linter';
import {
  createTypeScriptCompletionSource,
  createTypeScriptHoverTooltip,
  createTypeScriptProjectLinter,
  type CodeEditorTypeScriptProjectRef,
} from '../typescriptProject';
import { resolveTooltipParent } from './tooltipParent';

export const EditorCore: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  minHeight?: string | number;
  theme?: 'light' | 'dark';
  readonly?: boolean;
  enableLinter?: boolean;
  knownCtxMemberRoots?: string[];
  extraCompletions?: Completion[];
  completionSource?: CompletionSource;
  typescriptProjectRef?: CodeEditorTypeScriptProjectRef;
  viewRef: React.MutableRefObject<EditorView | null>;
}> = ({
  value = '',
  onChange,
  placeholder = '',
  height = '100%',
  minHeight,
  theme = 'light',
  readonly = false,
  enableLinter = false,
  knownCtxMemberRoots,
  extraCompletions,
  completionSource,
  typescriptProjectRef,
  viewRef,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef<typeof onChange>();
  const completionSourceRef = useRef(completionSource);
  const extraCompletionsRef = useRef(extraCompletions);
  completionSourceRef.current = completionSource;
  extraCompletionsRef.current = extraCompletions;
  const dynamicCompletionSource = useMemo<CompletionSource>(() => {
    return (context) => {
      if (completionSourceRef.current) {
        return completionSourceRef.current(context);
      }

      const options = extraCompletionsRef.current;
      if (!options?.length) {
        return null;
      }

      const word = context.matchBefore(/[$_\p{Letter}][$_\p{Letter}\p{Number}.-]*/u);
      if (!word) {
        return context.explicit ? { from: context.pos, to: context.pos, options } : null;
      }
      if (word.from === word.to && !context.explicit) {
        return null;
      }

      return { from: word.from, to: word.to, options };
    };
  }, []);
  const typeScriptCompletionSource = useMemo(
    () => createTypeScriptCompletionSource({ projectRef: typescriptProjectRef }),
    [typescriptProjectRef],
  );
  const typeScriptLinter = useMemo(
    () => createTypeScriptProjectLinter({ projectRef: typescriptProjectRef }),
    [typescriptProjectRef],
  );
  const typeScriptHover = useMemo(
    () => createTypeScriptHoverTooltip({ projectRef: typescriptProjectRef }),
    [typescriptProjectRef],
  );
  // keep latest onChange without re-creating the editor
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current) return;
    const cmMinHeight =
      typeof minHeight === 'undefined' ? undefined : typeof minHeight === 'string' ? minHeight : `${minHeight}px`;
    const gutterTheme =
      typeof cmMinHeight === 'string'
        ? {
            '.cm-gutter,.cm-content': {
              minHeight: cmMinHeight,
            },
          }
        : {};

    const extensions = [
      basicSetup,
      EditorState.readOnly.of(readonly),
      EditorView.editable.of(!readonly),
      javascriptWithHtmlTemplates(),
      autocompletion({
        override: [
          createHtmlCompletion(),
          createJsxCompletion(),
          dynamicCompletionSource,
          ...(typescriptProjectRef ? [typeScriptCompletionSource] : []),
        ],
        closeOnBlur: false,
        activateOnTyping: true,
      }),
      ...(placeholder ? [cmPlaceholder(placeholder)] : []),
      ...(enableLinter
        ? [lintGutter(), typescriptProjectRef ? typeScriptLinter : createJavaScriptLinter({ knownCtxMemberRoots })]
        : []),
      ...(typescriptProjectRef ? [typeScriptHover] : []),
      // Prefer the current popup container so completion tooltips stay above Modal/Drawer masks.
      tooltips({
        parent: resolveTooltipParent(editorRef.current),
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !readonly) {
          const newValue = update.state.doc.toString();
          try {
            onChangeRef.current?.(newValue);
          } catch (_) {
            void 0;
          }
        }
      }),
      EditorView.theme({
        '&.cm-editor': {
          height: typeof height === 'string' ? height || '100%' : `${height}px`,
        },
        ...gutterTheme,
        '.cm-scroller': {
          fontFamily: '"Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
          overflow: 'auto',
        },
        '.cm-placeholder': {
          color: '#999',
          fontStyle: 'normal',
          whiteSpace: 'pre',
          pointerEvents: 'none',
        },
        '.cm-diagnostic': {
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #d9d9d9',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px',
          maxWidth: '300px',
        },
        '.cm-diagnostic-error': {
          borderLeftColor: '#ff4d4f',
          borderLeftWidth: '3px',
        },
        '.cm-diagnostic-warning': {
          borderLeftColor: '#faad14',
          borderLeftWidth: '3px',
        },
        '.cm-diagnostic-info': {
          borderLeftColor: '#1890ff',
          borderLeftWidth: '3px',
        },
        '.cm-lintRange-error': {
          backgroundImage: `url("data:image/svg+xml;charset=utf8,<svg xmlns='http://www.w3.org/2000/svg' width='6' height='3'><path d='m0 3 l2 -2 l1 0 l2 2 l1 0' stroke='%23ff4d4f' fill='none' stroke-width='.7'/></svg>")`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left bottom',
        },
        '.cm-lintRange-warning': {
          backgroundImage: `url("data:image/svg+xml;charset=utf8,<svg xmlns='http://www.w3.org/2000/svg' width='6' height='3'><path d='m0 3 l2 -2 l1 0 l2 2 l1 0' stroke='%23faad14' fill='none' stroke-width='.7'/></svg>")`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left bottom',
        },
        '.cm-lintRange-info': {
          backgroundImage: `url("data:image/svg+xml;charset=utf8,<svg xmlns='http://www.w3.org/2000/svg' width='6' height='3'><path d='m0 3 l2 -2 l1 0 l2 2 l1 0' stroke='%231890ff' fill='none' stroke-width='.7'/></svg>")`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left bottom',
        },
        '.cm-tooltip': {
          zIndex: 1,
        },
      }),
    ];

    if (theme === 'dark') {
      extensions.push(oneDark);
    }

    // Preserve current document when reinitializing (e.g., theme/linters/completions change)
    const initialDoc = (
      viewRef.current && typeof viewRef.current.state?.doc?.toString === 'function'
        ? viewRef.current.state.doc.toString()
        : value || ''
    ) as string;
    const view = new EditorView({ doc: initialDoc, extensions, parent: editorRef.current });
    viewRef.current = view;
    return () => {
      try {
        view.destroy();
      } catch (_) {
        void 0;
      }
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dynamicCompletionSource,
    enableLinter,
    height,
    minHeight,
    theme,
    readonly,
    placeholder,
    typeScriptCompletionSource,
    typeScriptHover,
    typeScriptLinter,
    typescriptProjectRef,
  ]);

  // Update editor content when value changes
  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== (value || '')) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value || '' } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const editorContainerMinHeight =
    typeof minHeight === 'undefined' ? 120 : typeof minHeight === 'string' ? minHeight : `${minHeight}px`;

  return (
    <>
      <div style={{ flex: 1, minHeight: editorContainerMinHeight, minWidth: 0, overflow: 'hidden' }} ref={editorRef} />
    </>
  );
};
