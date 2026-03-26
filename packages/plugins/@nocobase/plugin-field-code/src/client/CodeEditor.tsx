/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createStyles } from 'antd-style';
import { connect, mapReadPretty } from '@formily/react';
import { basicSetup } from 'codemirror';
import { indentLess } from '@codemirror/commands';
import { EditorView, keymap } from '@codemirror/view';
import { LANGUAGES_MAP } from './languages';
import { Compartment, EditorSelection, EditorState, Prec } from '@codemirror/state';
import { indentUnit as indentUnitFacet } from '@codemirror/language';

// import { linter } from '@codemirror/lint';
// import { JSHINT } from 'jshint';

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

// const jshintLinter = linter(async (view) => {
//   const code = view.state.doc.toString();
//   // 运行 JSHint
//   JSHINT(code, {
//     esversion: 11, // 支持现代 JavaScript 特性
//     asi: false, // 强制使用分号
//     browser: true, // 浏览器环境
//     undef: true, // 禁止未定义的变量
//     unused: true, // 警告未使用的变量
//     strict: 'global', // 强制使用严格模式
//     module: true, // 允许 ES 模块语法
//     // 可以根据需要添加更多配置
//   });
//   const errors = JSHINT.errors;

//   // 转换 JSHint 错误为 CodeMirror lint 格式
//   return (errors || [])
//     .map((err) => {
//       if (!err) return null;

//       try {
//         // 获取错误所在行的位置
//         const line = view.state.doc.line(err.line || 1);
//         const column = Math.min(Math.max(0, err.character - 1), line.length);

//         // 计算错误范围
//         let endColumn = column;
//         if (err.evidence) {
//           // 找到错误标记的实际长度
//           const errorToken = err.evidence.slice(column).match(/^\w+|./)?.[0] || '';
//           endColumn = Math.min(column + errorToken.length, line.length);
//         }

//         return {
//           from: line.from + column,
//           // 确保 to 位置不超过行的长度
//           to: line.from + endColumn,
//           message: err.reason || 'Syntax error',
//           severity: err.code && err.code.startsWith('W') ? 'warning' : 'error',
//           source: 'jshint',
//         };
//       } catch (e) {
//         console.warn('Error processing lint result:', e);
//         return null;
//       }
//     })
//     .filter(Boolean);
// });

async function loadLanguage(language) {
  if (LANGUAGES_MAP[language]) {
    return LANGUAGES_MAP[language].load();
  } else {
    console.warn(`Language ${language} not supported.`);
    return null;
  }
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
      .then((parser) => {
        setParser(parser);
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
