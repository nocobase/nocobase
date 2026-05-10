/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { Space, theme } from 'antd';
import React, { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MetaTreeNode } from '../../flowContext';
import { useFlowContext } from '../../FlowContextProvider';
import { FlowContextSelector } from '../FlowContextSelector';
import { useResolvedMetaTree } from './useResolvedMetaTree';
import { formatPathToValue as defaultFormatPathToValue, parseValueToPath as defaultParseValueToPath } from './utils';

type RangeIndexes = [number, number, number, number];

const DEFAULT_VARIABLE_REGEXP = /\{\{\s*([^{}]+?)\s*\}\}/g;
const TAG_CLASS = 'nb-variable-tag';

export interface VariableHybridInputConverters {
  formatPathToValue?: (item?: MetaTreeNode) => string | undefined;
  parseValueToPath?: (value?: string) => string[] | undefined;
  variableRegExp?: RegExp;
}

export interface VariableHybridInputProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  addonBefore?: React.ReactNode;
  metaTree?: MetaTreeNode[] | (() => MetaTreeNode[] | Promise<MetaTreeNode[]>);
  converters?: VariableHybridInputConverters;
  style?: React.CSSProperties;
  className?: string;
}

function reactNodeToPlainText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(reactNodeToPlainText).join('');
  if (isValidElement(node)) return reactNodeToPlainText(node.props.children);
  return '';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getDomValue(element: HTMLElement) {
  const out: string[] = [];
  for (const node of Array.from(element.childNodes)) {
    if (node instanceof HTMLElement && node.dataset.variable) {
      out.push(node.dataset.variable);
    } else {
      out.push(node.textContent || '');
    }
  }
  return out.join('');
}

function createTagHTML(variable: string, label: string) {
  return `<span class="${TAG_CLASS}" contenteditable="false" data-variable="${escapeHtml(
    variable,
  )}" title="${escapeHtml(label)}">${escapeHtml(label)}</span>`;
}

// Strip outer `{{ }}` and trim, so values like `{{ $env.x }}` and `{{$env.x}}`
// share the same lookup key.
function normalizeVariableKey(value: string): string {
  return value
    .replace(/^\{\{\s*/, '')
    .replace(/\s*\}\}$/, '')
    .trim();
}

function renderHTML(value: string, labelMap: Map<string, string>, regExp: RegExp) {
  const re = new RegExp(regExp.source, regExp.flags.includes('g') ? regExp.flags : `${regExp.flags}g`);
  return escapeHtml(value || '').replace(re, (matched) => {
    const label = labelMap.get(normalizeVariableKey(matched)) || matched;
    return createTagHTML(matched, label);
  });
}

function buildLabelMap(
  nodes: MetaTreeNode[] | undefined,
  ctxT: (text: string) => string,
  converters?: VariableHybridInputConverters,
) {
  const map = new Map<string, string>();

  function walk(items: MetaTreeNode[] = [], parentTitles: string[] = []) {
    for (const item of items) {
      const titlePart = reactNodeToPlainText(item.title || item.name);
      const titles = [...parentTitles, titlePart];
      const value = converters?.formatPathToValue?.(item) ?? defaultFormatPathToValue(item);
      if (value) {
        map.set(normalizeVariableKey(value), titles.map(ctxT).join('/'));
      }
      if (Array.isArray(item.children)) {
        walk(item.children as MetaTreeNode[], titles);
      }
    }
  }

  walk(nodes);
  return map;
}

function pasteHTML(container: HTMLElement, html: string, indexes?: RangeIndexes) {
  const selection = window.getSelection?.();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range) return;

  if (indexes) {
    const children = Array.from(container.childNodes);
    if (indexes[0] === -1) {
      if (indexes[1] && children[indexes[1] - 1]) {
        range.setStartAfter(children[indexes[1] - 1]);
      } else {
        range.setStart(container, 0);
      }
    } else {
      range.setStart(children[indexes[0]], indexes[1]);
    }

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

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const fragment = document.createDocumentFragment();
  let lastNode: ChildNode | null = null;
  while (wrapper.firstChild) {
    lastNode = fragment.appendChild(wrapper.firstChild);
  }
  range.deleteContents();
  range.insertNode(fragment);

  if (lastNode) {
    const next = new Range();
    next.setStartAfter(lastNode);
    next.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(next);
  }
}

function getSingleEndRange(nodes: ChildNode[], index: number, offset: number): [number, number] {
  if (index === -1) {
    let realIndex = offset;
    let collapseFlag = false;
    if (realIndex && nodes[realIndex - 1]?.nodeName === '#text' && nodes[realIndex]?.nodeName === '#text') {
      collapseFlag = true;
    }
    let textOffset = 0;
    for (let i = offset - 1; i >= 0; i -= 1) {
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
  }

  let realIndex = 0;
  let textOffset = 0;
  for (let i = 0; i < index + 1; i += 1) {
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

function getCurrentRange(element: HTMLElement): RangeIndexes {
  const selection = window.getSelection?.();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  if (!range || !element.contains(range.commonAncestorContainer)) {
    return [-1, 0, -1, 0];
  }

  const nodes = Array.from(element.childNodes);
  if (!nodes.length) return [-1, 0, -1, 0];

  const startIndex = range.startContainer === element ? -1 : nodes.indexOf(range.startContainer as HTMLElement);
  const endIndex = range.endContainer === element ? -1 : nodes.indexOf(range.endContainer as HTMLElement);

  return [
    ...getSingleEndRange(nodes, startIndex, range.startOffset),
    ...getSingleEndRange(nodes, endIndex, range.endOffset),
  ];
}

const VariableHybridInputComponent: React.FC<VariableHybridInputProps> = (props) => {
  const { addonBefore, className, converters, disabled, metaTree, onChange, placeholder, style } = props;
  const { token } = theme.useToken();
  const ctx = useFlowContext();
  const { resolvedMetaTree } = useResolvedMetaTree(metaTree);
  const inputRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [changed, setChanged] = useState(false);
  const [range, setRange] = useState<RangeIndexes>([-1, 0, -1, 0]);

  const value = typeof props.value === 'string' ? props.value : props.value == null ? '' : String(props.value);
  const variableRegExp = converters?.variableRegExp ?? DEFAULT_VARIABLE_REGEXP;

  const labelMap = useMemo(
    () => buildLabelMap(resolvedMetaTree as MetaTreeNode[] | undefined, ctx.t, converters),
    [resolvedMetaTree, ctx, converters],
  );

  const [html, setHtml] = useState(() => renderHTML(value, labelMap, variableRegExp));

  const emitChange = useCallback(
    (target: HTMLElement) => {
      onChange?.(getDomValue(target).trim());
    },
    [onChange],
  );

  useEffect(() => {
    setHtml(renderHTML(value, labelMap, variableRegExp));
    if (!changed) {
      setRange([-1, 0, -1, 0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, labelMap]);

  // Restore caret position after html update
  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    if (document.activeElement !== element) return;

    const nextRange = new Range();
    if (changed) {
      if (range.join() === '-1,0,-1,0') return;
      const selection = window.getSelection?.();
      if (!selection) return;
      try {
        const children = Array.from(element.childNodes) as HTMLElement[];
        if (children.length) {
          if (range[0] === -1) {
            if (range[1]) nextRange.setStartAfter(children[range[1] - 1]);
          } else {
            nextRange.setStart(children[range[0]], range[1]);
          }
          if (range[2] === -1) {
            if (range[3]) nextRange.setEndAfter(children[range[3] - 1]);
          } else {
            nextRange.setEnd(children[range[2]], range[3]);
          }
        }
        nextRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(nextRange);
      } catch {
        /* ignore */
      }
    } else {
      const { lastChild } = element;
      if (lastChild) {
        nextRange.setStartAfter(lastChild);
        nextRange.setEndAfter(lastChild);
        const nodes = Array.from(element.childNodes);
        const idx = nodes.indexOf(lastChild);
        const startIndex = nextRange.startContainer === element ? -1 : idx;
        const endIndex = nextRange.startContainer === element ? -1 : idx;
        setRange([startIndex, nextRange.startOffset, endIndex, nextRange.endOffset]);
      }
    }
  }, [changed, html, range]);

  const insertVariable = useCallback(
    (variable: string, meta?: MetaTreeNode) => {
      const current = inputRef.current;
      if (!current || !variable) return;

      const label =
        labelMap.get(normalizeVariableKey(variable)) ||
        (meta
          ? [...(meta.parentTitles || []), reactNodeToPlainText(meta.title || meta.name)].map(ctx.t).join('/')
          : variable);

      current.focus();
      pasteHTML(current, createTagHTML(variable, label), range);
      setChanged(true);
      setRange(getCurrentRange(current));
      emitChange(current);
    },
    [labelMap, range, emitChange, ctx],
  );

  const handleSelectorChange = useCallback(
    (next: string, meta?: MetaTreeNode) => {
      if (!next) return;
      insertVariable(next, meta);
    },
    [insertVariable],
  );

  const handleInput = useCallback(
    ({ currentTarget }: React.FormEvent<HTMLDivElement>) => {
      if (isComposing) return;
      setChanged(true);
      setRange(getCurrentRange(currentTarget));
      emitChange(currentTarget);
    },
    [emitChange, isComposing],
  );

  const handleBlur = useCallback(({ currentTarget }: React.FocusEvent<HTMLDivElement>) => {
    setRange(getCurrentRange(currentTarget));
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  }, []);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      // Paste as plain text only; variable tags must be inserted via the picker.
      const text = event.clipboardData.getData('text/plain').replace(/\n/g, ' ');
      if (!text) return;
      setChanged(true);
      pasteHTML(event.currentTarget, escapeHtml(text));
      setRange(getCurrentRange(event.currentTarget));
      emitChange(event.currentTarget);
    },
    [emitChange],
  );

  const handleCompositionStart = useCallback(() => setIsComposing(true), []);
  const handleCompositionEnd = useCallback(
    ({ currentTarget }: React.CompositionEvent<HTMLDivElement>) => {
      setIsComposing(false);
      setChanged(true);
      setRange(getCurrentRange(currentTarget));
      emitChange(currentTarget);
    },
    [emitChange],
  );

  const wrapperClassName = useMemo(
    () => css`
      display: flex;
      width: 100%;
      min-width: 0;

      &.ant-space-compact {
        display: flex;
      }

      /* The trigger button from FlowContextSelector sits at the right end.
         Flatten its left corners so it shares the border with the editor. */
      > .ant-btn {
        flex-shrink: 0;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        margin-left: -${token.lineWidth}px;
      }

      > .ant-btn:hover,
      > .ant-btn:focus {
        z-index: 2;
      }
    `,
    [token.lineWidth],
  );

  const addonClassName = useMemo(
    () => css`
      display: inline-flex;
      align-items: center;
      padding: 0 ${token.paddingSM}px;
      background: ${token.colorFillTertiary};
      border: ${token.lineWidth}px ${token.lineType} ${token.colorBorder};
      border-right: 0;
      border-radius: ${token.borderRadius}px 0 0 ${token.borderRadius}px;
      color: ${token.colorText};
      font-size: ${token.fontSize}px;
      line-height: 1;
      white-space: nowrap;
    `,
    [token],
  );

  const editorClassName = useMemo(() => {
    const verticalPad = Math.max(
      0,
      (token.controlHeight - Math.round(token.lineHeight * token.fontSize)) / 2 - token.lineWidth,
    );
    return css`
      flex: 1 1 auto;
      min-width: 0;
      min-height: ${token.controlHeight}px;
      padding: ${verticalPad}px ${token.paddingSM}px;
      overflow: hidden;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: ${token.lineHeight};
      font-size: ${token.fontSize}px;
      color: ${token.colorText};
      background: ${token.colorBgContainer};
      border: ${token.lineWidth}px ${token.lineType} ${token.colorBorder};
      /* Right corners are always flat because the X picker button is glued to the right side. */
      border-radius: ${addonBefore ? '0' : `${token.borderRadius}px 0 0 ${token.borderRadius}px`};
      cursor: text;
      transition: all ${token.motionDurationMid};
      outline: none;

      &:hover {
        border-color: ${token.colorPrimaryHover};
        z-index: 1;
      }

      &:focus,
      &:focus-visible {
        border-color: ${token.colorPrimary};
        box-shadow: 0 0 0 ${token.controlOutlineWidth}px ${token.controlOutline};
        z-index: 1;
      }

      &[data-placeholder]:empty::before {
        content: attr(data-placeholder);
        color: ${token.colorTextPlaceholder};
        pointer-events: none;
      }

      .${TAG_CLASS} {
        /* inline lets long tag content wrap naturally across lines, mirroring v1. */
        display: inline;
        margin: 0 ${token.marginXXS}px;
        padding: ${token.paddingXXS}px ${token.paddingXS}px;
        font-size: ${token.fontSizeSM}px;
        line-height: ${token.lineHeightSM};
        color: ${token.colorPrimaryText};
        background: ${token.colorPrimaryBg};
        border: ${token.lineWidth}px ${token.lineType} ${token.colorPrimaryBorder};
        border-radius: ${token.borderRadiusSM}px;
        vertical-align: baseline;
        user-select: none;
        cursor: default;
      }

      &.is-disabled {
        background: ${token.colorBgContainerDisabled};
        color: ${token.colorTextDisabled};
        border-color: ${token.colorBorder};
        cursor: not-allowed;

        &:hover {
          border-color: ${token.colorBorder};
        }

        .${TAG_CLASS} {
          color: ${token.colorTextDisabled};
          background: ${token.colorFillTertiary};
          border-color: ${token.colorBorder};
        }
      }
    `;
  }, [token, addonBefore]);

  return (
    <>
      <Space.Compact className={cx('nb-variable-hybrid-input', wrapperClassName, className)} style={style}>
        {addonBefore != null && <span className={addonClassName}>{addonBefore}</span>}
        <div
          ref={inputRef}
          role="textbox"
          aria-label="textbox"
          className={cx(editorClassName, {
            'is-disabled': disabled,
          })}
          contentEditable={!disabled}
          data-placeholder={placeholder}
          onInput={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <FlowContextSelector
          metaTree={metaTree}
          disabled={disabled}
          parseValueToPath={converters?.parseValueToPath ?? defaultParseValueToPath}
          formatPathToValue={(item) => converters?.formatPathToValue?.(item) || defaultFormatPathToValue(item)}
          onChange={handleSelectorChange}
        />
      </Space.Compact>
    </>
  );
};

export const VariableHybridInput = React.memo(VariableHybridInputComponent);
