import React, { useRef, useEffect } from 'react';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { linter } from '@codemirror/lint';
import { JSHINT } from 'jshint';
import { useMemoizedFn } from 'ahooks';
import { createStyles } from 'antd-style';

type Props = {
  onChange: Function;
  value: string;
  disabled: boolean;
};

const useStyles = createStyles(({ token, css }) => ({
  box: css`
    display: flex;
    width: 100%;
    height: 20em;

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
    }
  `,
}));
const disableTheme = EditorView.theme({
  '.cm-scroller': { backgroundColor: '#f0f0f0' },
});
const enableTheme = EditorView.theme({
  '.cm-scroller': { backgroundColor: '#fff' },
});

const jshintLinter = linter(async (view) => {
  const code = view.state.doc.toString();
  // 运行 JSHint
  JSHINT(code, {
    esversion: 11, // 支持现代 JavaScript 特性
    asi: false, // 强制使用分号
    browser: true, // 浏览器环境
    undef: true, // 禁止未定义的变量
    unused: true, // 警告未使用的变量
    strict: 'global', // 强制使用严格模式
    module: true, // 允许 ES 模块语法
    // 可以根据需要添加更多配置
  });
  const errors = JSHINT.errors;

  // 转换 JSHint 错误为 CodeMirror lint 格式
  return (errors || [])
    .map((err) => {
      if (!err) return null;

      try {
        // 获取错误所在行的位置
        const line = view.state.doc.line(err.line || 1);
        const column = Math.min(Math.max(0, err.character - 1), line.length);

        // 计算错误范围
        let endColumn = column;
        if (err.evidence) {
          // 找到错误标记的实际长度
          const errorToken = err.evidence.slice(column).match(/^\w+|./)?.[0] || '';
          endColumn = Math.min(column + errorToken.length, line.length);
        }

        return {
          from: line.from + column,
          // 确保 to 位置不超过行的长度
          to: line.from + endColumn,
          message: err.reason || 'Syntax error',
          severity: err.code && err.code.startsWith('W') ? 'warning' : 'error',
          source: 'jshint',
        };
      } catch (e) {
        console.warn('Error processing lint result:', e);
        return null;
      }
    })
    .filter(Boolean);
});

const CodeEditor: React.FC<Props> = ({ onChange, value, disabled }) => {
  const editorRef = useRef(null);
  const handleChange = useMemoizedFn((val) => {
    onChange && onChange(val);
  });

  const { styles } = useStyles();

  const compartment = new Compartment();
  useEffect(() => {
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        javascript(),
        compartment.of(jshintLinter),
        EditorView.updateListener.of((v) => {
          if (v.docChanged) {
            const content = v.state.doc.toString();
            handleChange(content);
          }
        }),
        EditorView.editable.of(!disabled),
        disabled ? disableTheme : enableTheme,
      ],
    });
    const editor = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      editor.destroy();
    };
  }, [disabled]);
  return <div ref={editorRef} className={styles.box} />;
};

export default CodeEditor;
