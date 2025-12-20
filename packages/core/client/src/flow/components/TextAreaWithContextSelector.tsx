/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * 轻量变量输入组件：左侧 TextArea + 右侧 FlowContextSelector
 * 点击变量选择器后，将形如 {{ ctx.xxx.yyy }} 的变量插入到当前光标位置。
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input } from 'antd';
import { css } from '@emotion/css';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { FlowContextSelector, useFlowContext } from '@nocobase/flow-engine';

export interface TextAreaWithContextSelectorProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
}

/**
 * TextArea 与变量选择器的组合，紧凑排版，边框无缝拼接。
 */
export const TextAreaWithContextSelector: React.FC<TextAreaWithContextSelectorProps> = ({
  value = '',
  onChange,
  placeholder,
  rows = 3,
  style,
}) => {
  const flowCtx = useFlowContext();
  const [innerValue, setInnerValue] = useState<string>(value || '');
  const ref = useRef<TextAreaRef>(null);

  // 外部 value 变化时同步内部显示
  useEffect(() => {
    setInnerValue(value || '');
  }, [value]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e?.target?.value ?? '';
      setInnerValue(next);
      onChange?.(next);
    },
    [onChange],
  );

  // 将指定文本插入到当前光标位置
  const insertAtCaret = useCallback(
    (toInsert: string) => {
      const el = ref.current?.resizableTextArea?.textArea as HTMLTextAreaElement | undefined;
      if (!el) {
        const next = (innerValue || '') + (toInsert || '');
        setInnerValue(next);
        onChange?.(next);
        return;
      }
      const start = el.selectionStart ?? innerValue?.length ?? 0;
      const end = el.selectionEnd ?? start;
      const prev = innerValue || '';
      const next = prev.slice(0, start) + toInsert + prev.slice(end);
      setInnerValue(next);
      onChange?.(next);
      // 恢复光标位置并聚焦
      requestAnimationFrame(() => {
        const pos = start + (toInsert?.length || 0);
        el.setSelectionRange(pos, pos);
        el.focus();
      });
    },
    [innerValue, onChange],
  );

  const handleVariableSelected = useCallback(
    (varValue: string) => {
      if (!varValue) return;
      insertAtCaret(varValue);
    },
    [insertAtCaret],
  );

  // 使用函数形式提供变量树，保证与运行时上下文一致
  const metaTree = useMemo(() => () => flowCtx.getPropertyMetaTree?.(), [flowCtx]);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <Input.TextArea
        ref={ref}
        value={innerValue}
        onChange={handleTextChange}
        rows={rows}
        placeholder={placeholder}
        style={{ width: '100%' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
          lineHeight: 0,
        }}
      >
        <FlowContextSelector metaTree={metaTree} onChange={(val) => handleVariableSelected(val)}>
          <Button
            type="default"
            style={{ fontStyle: 'italic', fontFamily: 'New York, Times New Roman, Times, serif' }}
            className={css`
              &:not(:hover) {
                border-right-color: transparent;
                border-top-color: transparent;
                background-color: transparent;
              }
            `}
          >
            x
          </Button>
        </FlowContextSelector>
      </div>
    </div>
  );
};

export default TextAreaWithContextSelector;
