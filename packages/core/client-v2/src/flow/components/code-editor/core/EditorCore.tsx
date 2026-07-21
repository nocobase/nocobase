/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  acceptCompletion,
  autocompletion,
  completionStatus,
  type Completion,
  type CompletionSource,
} from '@codemirror/autocomplete';
import { json } from '@codemirror/lang-json';
import { forceLinting, lintGutter } from '@codemirror/lint';
import { Compartment, EditorSelection, EditorState, Prec, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { EditorView, keymap, placeholder as cmPlaceholder, tooltips } from '@codemirror/view';
import { javascriptWithHtmlTemplates } from '../javascriptHtmlTemplate';
import { createHtmlCompletion } from '../htmlCompletion';
import { createJsxCompletion } from '../jsxCompletion';
import {
  createJsonCompletionSource,
  createJsonHoverTooltip,
  createJsonLinter,
  type CodeEditorJsonSchema,
  type CodeEditorJsonSchemaRef,
} from '../jsonLanguageService';
import { createJavaScriptLinter } from '../linter';
import {
  createTypeScriptCompletionSource,
  createTypeScriptHoverTooltip,
  createTypeScriptProjectLinter,
  createTypeScriptProjectSession,
  type CodeEditorTypeScriptProjectRef,
} from '../typescriptProject';
import { resolveTooltipParent } from './tooltipParent';

const acceptCompletionOrKeepPending = (view: EditorView): boolean => {
  if (completionStatus(view.state) === 'pending') return true;
  return acceptCompletion(view);
};

const tabCompletionKeymap = Prec.highest(keymap.of([{ key: 'Tab', run: acceptCompletionOrKeepPending }]));

function isJsonLanguage(language: string | undefined): boolean {
  return language?.trim().toLowerCase() === 'json';
}

function createEditorTheme(height: string | number, minHeight: string | number | undefined): Extension {
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

  return EditorView.theme({
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
  });
}

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
  language?: string;
  jsonSchema?: CodeEditorJsonSchema;
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
  language,
  jsonSchema,
  viewRef,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef<typeof onChange>();
  const readonlyRef = useRef(readonly);
  const completionSourceRef = useRef(completionSource);
  const extraCompletionsRef = useRef(extraCompletions);
  const jsonSchemaRef = useRef<CodeEditorJsonSchema | undefined>(jsonSchema) as CodeEditorJsonSchemaRef;
  const stableTypeScriptProjectRef = useRef(typescriptProjectRef?.current);
  const readonlyCompartment = useMemo(() => new Compartment(), []);
  const languageCompartment = useMemo(() => new Compartment(), []);
  const completionCompartment = useMemo(() => new Compartment(), []);
  const linterCompartment = useMemo(() => new Compartment(), []);
  const hoverCompartment = useMemo(() => new Compartment(), []);
  const placeholderCompartment = useMemo(() => new Compartment(), []);
  const themeCompartment = useMemo(() => new Compartment(), []);
  const editorThemeCompartment = useMemo(() => new Compartment(), []);
  const typeScriptExtensionsRef = useRef<{
    completionSource: CompletionSource;
    hover: Extension;
    linter: Extension;
  } | null>(null);

  completionSourceRef.current = completionSource;
  extraCompletionsRef.current = extraCompletions;
  jsonSchemaRef.current = jsonSchema;
  stableTypeScriptProjectRef.current = typescriptProjectRef?.current;
  readonlyRef.current = readonly;

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
  const jsonCompletionSource = useMemo(() => createJsonCompletionSource(jsonSchemaRef), []);
  const jsonLinter = useMemo(() => createJsonLinter(jsonSchemaRef), []);
  const jsonHover = useMemo(() => createJsonHoverTooltip(jsonSchemaRef), []);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const typeScriptProjectSession = createTypeScriptProjectSession();
    const typeScriptExtensions = {
      completionSource: createTypeScriptCompletionSource({
        projectRef: stableTypeScriptProjectRef,
        session: typeScriptProjectSession,
      }),
      hover: createTypeScriptHoverTooltip({
        projectRef: stableTypeScriptProjectRef,
        session: typeScriptProjectSession,
      }),
      linter: createTypeScriptProjectLinter({
        projectRef: stableTypeScriptProjectRef,
        session: typeScriptProjectSession,
      }),
    };
    typeScriptExtensionsRef.current = typeScriptExtensions;
    const jsonLanguage = isJsonLanguage(language);
    const view = new EditorView({
      doc: value || '',
      extensions: [
        basicSetup,
        tabCompletionKeymap,
        readonlyCompartment.of([EditorState.readOnly.of(readonly), EditorView.editable.of(!readonly)]),
        languageCompartment.of(jsonLanguage ? json() : javascriptWithHtmlTemplates()),
        completionCompartment.of(
          autocompletion({
            override: jsonLanguage
              ? [jsonCompletionSource]
              : [
                  createHtmlCompletion(),
                  createJsxCompletion(),
                  dynamicCompletionSource,
                  typeScriptExtensions.completionSource,
                ],
            closeOnBlur: false,
            activateOnTyping: true,
            interactionDelay: 0,
          }),
        ),
        linterCompartment.of(
          jsonLanguage
            ? [lintGutter(), jsonLinter]
            : enableLinter
              ? [
                  lintGutter(),
                  stableTypeScriptProjectRef.current
                    ? typeScriptExtensions.linter
                    : createJavaScriptLinter({ knownCtxMemberRoots }),
                ]
              : [],
        ),
        hoverCompartment.of(jsonLanguage ? jsonHover : typeScriptExtensions.hover),
        placeholderCompartment.of(placeholder ? cmPlaceholder(placeholder) : []),
        themeCompartment.of(theme === 'dark' ? oneDark : []),
        editorThemeCompartment.of(createEditorTheme(height, minHeight)),
        tooltips({
          parent: resolveTooltipParent(editorRef.current),
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const project = stableTypeScriptProjectRef.current;
            if (project) project.documentRevision = (project.documentRevision || 0) + 1;
          }
          if (update.docChanged && !readonlyRef.current) {
            const newValue = update.state.doc.toString();
            try {
              onChangeRef.current?.(newValue);
            } catch (_) {
              // Ignore host callbacks so editor input stays responsive.
            }
          }
        }),
      ],
      parent: editorRef.current,
    });
    viewRef.current = view;

    return () => {
      try {
        view.destroy();
      } catch (_) {
        // EditorView.destroy is best-effort during host teardown.
      }
      typeScriptProjectSession.dispose();
      typeScriptExtensionsRef.current = null;
      viewRef.current = null;
    };
    // Dynamic editor behavior is updated through compartments below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    const typeScriptExtensions = typeScriptExtensionsRef.current;
    if (!view || !typeScriptExtensions) {
      return;
    }

    const jsonLanguage = isJsonLanguage(language);
    view.dispatch({
      effects: [
        readonlyCompartment.reconfigure([EditorState.readOnly.of(readonly), EditorView.editable.of(!readonly)]),
        languageCompartment.reconfigure(jsonLanguage ? json() : javascriptWithHtmlTemplates()),
        completionCompartment.reconfigure(
          autocompletion({
            override: jsonLanguage
              ? [jsonCompletionSource]
              : [
                  createHtmlCompletion(),
                  createJsxCompletion(),
                  dynamicCompletionSource,
                  typeScriptExtensions.completionSource,
                ],
            closeOnBlur: false,
            activateOnTyping: true,
            interactionDelay: 0,
          }),
        ),
        linterCompartment.reconfigure(
          jsonLanguage
            ? [lintGutter(), jsonLinter]
            : enableLinter
              ? [
                  lintGutter(),
                  stableTypeScriptProjectRef.current
                    ? typeScriptExtensions.linter
                    : createJavaScriptLinter({ knownCtxMemberRoots }),
                ]
              : [],
        ),
        hoverCompartment.reconfigure(jsonLanguage ? jsonHover : typeScriptExtensions.hover),
        placeholderCompartment.reconfigure(placeholder ? cmPlaceholder(placeholder) : []),
        themeCompartment.reconfigure(theme === 'dark' ? oneDark : []),
        editorThemeCompartment.reconfigure(createEditorTheme(height, minHeight)),
      ],
    });
  }, [
    completionCompartment,
    dynamicCompletionSource,
    editorThemeCompartment,
    enableLinter,
    height,
    hoverCompartment,
    jsonCompletionSource,
    jsonHover,
    jsonLinter,
    knownCtxMemberRoots,
    language,
    languageCompartment,
    linterCompartment,
    minHeight,
    placeholder,
    placeholderCompartment,
    readonly,
    readonlyCompartment,
    theme,
    themeCompartment,
    typescriptProjectRef,
    viewRef,
  ]);

  useEffect(() => {
    const view = viewRef.current;
    if (view && isJsonLanguage(language)) {
      forceLinting(view);
    }
  }, [jsonSchema, language, viewRef]);

  useEffect(() => {
    const view = viewRef.current;
    const nextValue = value || '';
    if (!view || view.state.doc.toString() === nextValue) {
      return;
    }

    const clampPosition = (position: number) => Math.min(position, nextValue.length);
    const selection = EditorSelection.create(
      view.state.selection.ranges.map((range) =>
        EditorSelection.range(clampPosition(range.anchor), clampPosition(range.head)),
      ),
      view.state.selection.mainIndex,
    );
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: nextValue },
      selection,
    });
  }, [value, viewRef]);

  const editorContainerMinHeight =
    typeof minHeight === 'undefined' ? 120 : typeof minHeight === 'string' ? minHeight : `${minHeight}px`;

  return (
    <div style={{ flex: 1, minHeight: editorContainerMinHeight, minWidth: 0, overflow: 'hidden' }} ref={editorRef} />
  );
};
