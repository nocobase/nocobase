/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { cx } from '@emotion/css';
import sanitizeHTML from 'sanitize-html';
import { useRenderUISchemaTag } from './useRenderUISchemaTag';

type Props = {
  value: string;
  onChange: (event?: any) => void;
  disabled?: boolean;
};

type RangeIndexes = [number, number, number, number];

/**
 * 将HTML内容粘贴到容器元素中
 */
function pasteHTML(
  container: HTMLElement,
  html: string,
  { selectPastedContent = false, range: indexes }: { selectPastedContent?: boolean; range?: RangeIndexes } = {},
) {
  const sel = window.getSelection?.();
  if (!sel) return;

  const range = sel.getRangeAt(0);
  if (!range) return;

  // 设置范围位置
  if (indexes) {
    const children = Array.from(container.childNodes);

    // 设置起始位置
    if (indexes[0] === -1) {
      if (indexes[1] && children[indexes[1] - 1]) {
        range.setStartAfter(children[indexes[1] - 1]);
      } else {
        range.setStart(container, 0);
      }
    } else {
      range.setStart(children[indexes[0]], indexes[1]);
    }

    // 设置结束位置
    if (indexes[2] === -1) {
      if (indexes[3] && children[indexes[3] - 1]) {
        range.setEndAfter(children[indexes[3] - 1]);
      } else {
        range.setEnd(container, 0);
      }
    } else {
      range.setEnd(children[indexes[2]], indexes[3]);
    }
  }

  // 创建文档片段
  const el = document.createElement('div');
  el.innerHTML = html;
  const frag = document.createDocumentFragment();
  let lastNode;

  while (el.firstChild) {
    lastNode = frag.appendChild(el.firstChild);
  }

  const { firstChild } = frag;
  range.deleteContents();
  range.insertNode(frag);

  // 保持选择状态
  if (lastNode) {
    const next = new Range();
    next.setStartAfter(lastNode);

    if (selectPastedContent && firstChild) {
      next.setStartBefore(firstChild);
    } else {
      next.collapse(true);
    }

    sel.removeAllRanges();
    sel.addRange(next);
  }
}

/**
 * 获取单个结束范围位置
 */
function getSingleEndRange(nodes: ChildNode[], index: number, offset: number): [number, number] {
  if (index === -1) {
    let realIndex = offset;
    let collapseFlag = false;

    if (realIndex && nodes[realIndex - 1]?.nodeName === '#text' && nodes[realIndex]?.nodeName === '#text') {
      collapseFlag = true;
    }

    let textOffset = 0;
    for (let i = offset - 1; i >= 0; i--) {
      if (collapseFlag) {
        if (nodes[i]?.nodeName === '#text') {
          textOffset += nodes[i].textContent?.length || 0;
        } else {
          collapseFlag = false;
        }
      }

      if (nodes[i]?.nodeName === '#text' && nodes[i + 1]?.nodeName === '#text') {
        realIndex -= 1;
      }
    }

    return textOffset ? [realIndex, textOffset] : [-1, realIndex];
  } else {
    let realIndex = 0;
    let textOffset = 0;

    for (let i = 0; i < index + 1; i++) {
      if (nodes[i]?.nodeName === '#text') {
        if (i !== index && nodes[i + 1] && nodes[i + 1]?.nodeName !== '#text') {
          realIndex += 1;
        }
        textOffset += i === index ? offset : nodes[i].textContent?.length || 0;
      } else {
        realIndex += 1;
        textOffset = 0;
      }
    }

    return [realIndex, textOffset];
  }
}

/**
 * 从元素中提取值（包括变量标签）
 */
function getValue(el: HTMLElement, delimiters = ['{{', '}}']) {
  const values: string[] = [];

  for (const node of el.childNodes) {
    if (node.nodeName === 'SPAN' && (node as HTMLElement)?.dataset?.variable) {
      values.push(`${delimiters[0]}$UISchema.${(node as HTMLElement).dataset.variable}${delimiters[1]}`);
    } else {
      values.push(node.textContent || '');
    }
  }

  return values.join('');
}

/**
 * 获取当前选择范围
 */
function getCurrentRange(element: HTMLElement): RangeIndexes {
  const sel = window.getSelection?.();
  if (!sel) return [-1, 0, -1, 0];

  const range = sel.getRangeAt(0);
  if (!range) return [-1, 0, -1, 0];

  const nodes = Array.from(element.childNodes);
  if (!nodes.length) return [-1, 0, -1, 0];

  const startElementIndex = range.startContainer === element ? -1 : nodes.indexOf(range.startContainer as ChildNode);
  const endElementIndex = range.endContainer === element ? -1 : nodes.indexOf(range.endContainer as ChildNode);

  return [
    ...getSingleEndRange(nodes, startElementIndex, range.startOffset),
    ...getSingleEndRange(nodes, endElementIndex, range.endOffset),
  ];
}

/**
 * 可变标签输入组件
 */
export const VariableInput = forwardRef<
  { focus: () => void; blur: () => void; nativeElement: HTMLDivElement | null },
  Props
>((props, ref) => {
  const { value, onChange, disabled } = props;
  const [changed, setChanged] = useState(false);
  const [ime, setIME] = useState(false);
  const [range, setRange] = useState<RangeIndexes>([-1, 0, -1, 0]);
  const inputRef = useRef<HTMLDivElement>(null);

  const {
    html,
    styles: { wrapSSR, componentCls, hashId },
  } = useRenderUISchemaTag(value);

  // 处理内容变更
  const handleContentChange = useCallback(
    (target: HTMLDivElement) => {
      const newValue = getValue(target).trim();
      onChange?.({
        target: { value: newValue },
      });
    },
    [onChange],
  );

  // 处理输入事件
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      if (ime) return;

      const target = e.currentTarget;
      setChanged(true);
      setRange(getCurrentRange(target));
      handleContentChange(target);
    },
    [ime, handleContentChange],
  );

  // 处理中文输入法开始
  const handleCompositionStart = useCallback(() => {
    setIME(true);
  }, []);

  // 处理中文输入法结束
  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLDivElement>) => {
      setIME(false);

      const target = e.currentTarget;
      setChanged(true);
      setRange(getCurrentRange(target));
      handleContentChange(target);
    },
    [handleContentChange],
  );

  // 处理粘贴事件
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();

      const input = e.clipboardData.getData('text/html') || e.clipboardData.getData('text');
      const sanitizedHTML = sanitizeHTML(input, {
        allowedTags: ['span'],
        allowedAttributes: {
          span: ['data-variable', 'contenteditable'],
        },
        allowedClasses: {
          span: ['ant-tag', 'ant-tag-*'],
        },
        transformTags: {
          span(tagName, attribs) {
            return attribs['data-variable'] ? { tagName, attribs } : {};
          },
        },
      }).replace(/\n/g, ' ');

      const target = e.currentTarget;
      setChanged(true);
      pasteHTML(target, sanitizedHTML);
      setRange(getCurrentRange(target));
      handleContentChange(target);
    },
    [handleContentChange],
  );

  // 处理失焦事件
  const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    setRange(getCurrentRange(e.currentTarget));
  }, []);

  // 暴露方法给父组件
  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      nativeElement: inputRef.current,
    }),
    [],
  );

  // 重置range当内容未变更
  useEffect(() => {
    if (!changed) {
      setRange([-1, 0, -1, 0]);
    }
  }, [changed]);

  // 处理光标位置
  useEffect(() => {
    const { current } = inputRef;
    if (!current) {
      return;
    }
    const nextRange = new Range();
    if (changed) {
      // setChanged(false);
      if (range.join() === '-1,0,-1,0') {
        return;
      }
      const sel = window.getSelection?.();
      if (sel) {
        try {
          const children = Array.from(current.childNodes) as HTMLElement[];
          if (children.length) {
            if (range[0] === -1) {
              if (range[1]) {
                nextRange.setStartAfter(children[range[1] - 1]);
              }
            } else {
              nextRange.setStart(children[range[0]], range[1]);
            }
            if (range[2] === -1) {
              if (range[3]) {
                nextRange.setEndAfter(children[range[3] - 1]);
              }
            } else {
              nextRange.setEnd(children[range[2]], range[3]);
            }
          }
          nextRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(nextRange);
        } catch (ex) {
          // console.error(ex);
        }
      }
    } else {
      const { lastChild } = current;
      if (lastChild) {
        nextRange.setStartAfter(lastChild);
        nextRange.setEndAfter(lastChild);
        const nodes = Array.from(current.childNodes);
        const startElementIndex = nextRange.startContainer === current ? -1 : nodes.indexOf(lastChild);
        const endElementIndex = nextRange.startContainer === current ? -1 : nodes.indexOf(lastChild);
        setRange([startElementIndex, nextRange.startOffset, endElementIndex, nextRange.endOffset]);
      }
    }
  }, [html]);

  return wrapSSR(
    <div
      ref={inputRef}
      contentEditable={!disabled}
      dangerouslySetInnerHTML={{ __html: html }}
      className={cx('ant-input variable-input', hashId, componentCls)}
      onInput={handleInput}
      onPaste={handlePaste}
      onBlur={handleBlur}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      style={{
        padding: 0,
        whiteSpace: 'pre-wrap',
        outline: 'none',
      }}
      suppressContentEditableWarning
    />,
  );
});
