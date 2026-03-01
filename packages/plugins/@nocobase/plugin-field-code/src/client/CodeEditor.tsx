/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import { Input } from 'antd';
import { createStyles } from 'antd-style';
import { connect, mapReadPretty, useFieldSchema } from '@formily/react';
import { basicSetup } from 'codemirror';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { LANGUAGES_MAP } from './languages';
import { Compartment, EditorState } from '@codemirror/state';
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
  const [parser, setParser] = React.useState(null);
  const ref = useRef<{ view: EditorView }>();
  const indentUnitCompartment = useRef(new Compartment()).current;

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
    if (ref.current?.view && indentUnit) {
      ref.current.view.dispatch({
        effects: indentUnitCompartment.reconfigure(indentUnitFacet.of(' '.repeat(indentUnit))),
      });
    }
  }, [indentUnit, indentUnitCompartment]);

  // const compartment = new Compartment();

  return parser ? (
    <CodeMirror
      ref={ref}
      className={styles.box}
      height={height}
      value={value || ''}
      onChange={onChange}
      editable={!disabled}
      extensions={[
        basicSetup,
        parser,
        indentUnitCompartment.of(indentUnitFacet.of(' '.repeat(indentUnit || 2))),
        // compartment.of(jshintLinter),
        disabled ? disableTheme : enableTheme,
      ].filter(Boolean)}
    />
  ) : (
    <Input.TextArea {...props} />
  );
}

function ReadPretty(props) {
  return <Editor {...props} disabled={true} />;
}

export default connect(Editor, mapReadPretty(ReadPretty));
