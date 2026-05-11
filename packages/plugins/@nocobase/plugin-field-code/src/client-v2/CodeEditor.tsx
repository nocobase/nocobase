/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { indentLess } from '@codemirror/commands';
import { indentUnit as indentUnitFacet } from '@codemirror/language';
import { Compartment, EditorSelection, EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { connect, mapReadPretty } from '@formily/react';
import { createStyles } from 'antd-style';
import React, { useEffect, useRef, useState } from 'react';
import { LANGUAGES_MAP } from './languages';

const useStyles = createStyles(({ token, css }) => ({
  box: css`
    display: flex;
    width: 100%;

    .cm-editor {
      width: 100%;
      border-radius: ${token.borderRadius}px;
      border: 1px solid ${token.colorBorder};
      &:hover {
        border-color: ${token.colorPrimaryHover};
      }
      overflow: hidden;

      &.cm-focused {
        border-color: ${token.colorPrimaryHover};
        outline: none;
      }

      .cm-content {
        font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
      }
    }
  `,
}));

const disableTheme = EditorView.theme({
  '.cm-scroller': { backgroundColor: '#f0f0f0' },
});

const enableTheme = EditorView.theme({
  '.cm-scroller': { backgroundColor: '#fff' },
});

function normalizeIndentUnit(indentUnit: unknown) {
  const numericIndentUnit = Number(indentUnit);

  if (!Number.isFinite(numericIndentUnit) || numericIndentUnit <= 0) {
    return 2;
  }

  return Math.floor(numericIndentUnit);
}

function createHeightTheme(height?: string) {
  if (!height || height === 'auto') {
    return EditorView.theme({
      '&': {
        minHeight: '120px',
      },
      '.cm-editor': {
        minHeight: '120px',
      },
      '.cm-scroller': {
        minHeight: '120px',
      },
    });
  }

  return EditorView.theme({
    '&': {
      height,
      minHeight: '120px',
    },
    '.cm-editor': {
      height: '100%',
      minHeight: '120px',
    },
    '.cm-scroller': {
      height: '100%',
      minHeight: '120px',
      overflow: 'auto',
    },
  });
}

async function loadLanguage(language) {
  if (LANGUAGES_MAP[language]) {
    return LANGUAGES_MAP[language].load();
  }

  console.warn(`Language ${language} not supported.`);
  return null;
}

function Editor({ language, height, indentUnit, ...props }) {
  const { value, onChange, disabled } = props;
  const { styles } = useStyles();
  const [parser, setParser] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const indentUnitRef = useRef(2);

  const languageCompartment = useRef(new Compartment()).current;
  const indentUnitCompartment = useRef(new Compartment()).current;
  const tabSizeCompartment = useRef(new Compartment()).current;
  const keymapCompartment = useRef(new Compartment()).current;
  const editableCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;
  const heightCompartment = useRef(new Compartment()).current;
  const normalizedIndentUnit = normalizeIndentUnit(indentUnit);
  indentUnitRef.current = normalizedIndentUnit;

  const createIndentKeymap = () => {
    return Prec.highest(
      keymap.of([
        {
          key: 'Tab',
          run(view) {
            if (!view.state.facet(EditorView.editable)) {
              return false;
            }

            const indentText = ' '.repeat(indentUnitRef.current);
            const changes = view.state.changeByRange((range) => ({
              changes: {
                from: range.from,
                to: range.to,
                insert: indentText,
              },
              range: EditorSelection.cursor(range.from + indentText.length),
            }));

            view.dispatch(changes);
            return true;
          },
        },
        {
          key: 'Shift-Tab',
          run(view) {
            return indentLess(view);
          },
        },
      ]),
    );
  };

  useEffect(() => {
    loadLanguage(language)
      .then((nextParser) => {
        setParser(nextParser);
      })
      .catch((error) => {
        console.error('Error loading language:', error);
      });
  }, [language]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: [
          indentUnitCompartment.reconfigure(indentUnitFacet.of(' '.repeat(normalizedIndentUnit))),
          tabSizeCompartment.reconfigure(EditorState.tabSize.of(normalizedIndentUnit)),
          keymapCompartment.reconfigure(createIndentKeymap()),
        ],
      });
    }
  }, [normalizedIndentUnit, indentUnitCompartment, keymapCompartment, tabSizeCompartment]);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) {
      return;
    }

    const state = EditorState.create({
      doc: value || '',
      extensions: [
        basicSetup,
        languageCompartment.of(parser || []),
        indentUnitCompartment.of(indentUnitFacet.of(' '.repeat(normalizedIndentUnit))),
        tabSizeCompartment.of(EditorState.tabSize.of(normalizedIndentUnit)),
        keymapCompartment.of(createIndentKeymap()),
        editableCompartment.of(EditorView.editable.of(!disabled)),
        themeCompartment.of(disabled ? disableTheme : enableTheme),
        heightCompartment.of(createHeightTheme(height)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // The editor instance must stay stable while typing; later prop changes are handled by dedicated reconfigure effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: languageCompartment.reconfigure(parser || []),
      });
    }
  }, [parser, languageCompartment]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: editableCompartment.reconfigure(EditorView.editable.of(!disabled)),
      });
    }
  }, [disabled, editableCompartment]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.reconfigure(disabled ? disableTheme : enableTheme),
      });
    }
  }, [disabled, themeCompartment]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: heightCompartment.reconfigure(createHeightTheme(height)),
      });
    }
  }, [height, heightCompartment]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const nextValue = value || '';
    if (view.state.doc.toString() === nextValue) {
      return;
    }

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: nextValue,
      },
    });
  }, [value]);

  return (
    <div className={styles.box}>
      <div ref={editorRef} style={{ width: '100%' }} />
    </div>
  );
}

function ReadPretty(props) {
  return <Editor {...props} disabled={true} />;
}

export default connect(Editor, mapReadPretty(ReadPretty));
