/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { useForm } from '@formily/react';
import { Input as AntInput, Space, theme } from 'antd';
import type { CascaderProps, DefaultOptionType } from 'antd/lib/cascader';
import useInputStyle from 'antd/es/input/style';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import sanitizeHTML from 'sanitize-html';

import { error } from '@nocobase/utils/client';

import { isReactElement } from '@formily/shared';
import { EllipsisWithTooltip } from '../..';
import { VariableSelect } from './VariableSelect';
import { useStyles } from './style';

type RangeIndexes = [number, number, number, number];

function pasteHTML(
  container: HTMLElement,
  html: string,
  { selectPastedContent = false, range: indexes }: { selectPastedContent?: boolean; range?: RangeIndexes } = {},
) {
  // IE9 and non-IE
  const sel = window.getSelection?.();
  const range = sel?.getRangeAt(0);
  if (!range) {
    return;
  }

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

  // Range.createContextualFragment() would be useful here but is
  // only relatively recently standardized and is not supported in
  // some browsers (IE9, for one)
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

  // Preserve the selection
  if (lastNode) {
    const next = new Range();
    next.setStartAfter(lastNode);
    if (selectPastedContent) {
      if (firstChild) {
        next.setStartBefore(firstChild);
      }
    } else {
      next.collapse(true);
    }
    sel!.removeAllRanges();
    sel!.addRange(next);
  }
}

function getValue(el, delimiters = ['{{', '}}']) {
  const values: any[] = [];
  for (const node of el.childNodes) {
    if (node.nodeName === 'SPAN' && node['dataset']['variable']) {
      values.push(`${delimiters[0]}${node['dataset']['variable']}${delimiters[1]}`);
    } else {
      values.push(node.textContent);
    }
  }
  return values.join('');
}

function renderHTML(exp: string, keyLabelMap, delimiters: [string, string] = ['{{', '}}']) {
  const variableRegExp = new RegExp(`${delimiters[0]}\\s*([^{}]+)\\s*${delimiters[1]}`, 'g');
  return exp.replace(variableRegExp, (_, i) => {
    const key = i.trim();
    return createVariableTagHTML(key, keyLabelMap) ?? '';
  });
}

function createOptionsValueLabelMap(options: any[], fieldNames: CascaderProps['fieldNames'] = defaultFieldNames) {
  const map = new Map<string, string[]>();
  for (const option of options) {
    map.set(option[fieldNames.value], [option[fieldNames.label]]);
    if (option.children) {
      for (const [value, labels] of createOptionsValueLabelMap(option.children, fieldNames)) {
        map.set(`${option[fieldNames.value]}.${value}`, [option[fieldNames.label], ...labels]);
      }
    }
  }
  return map;
}

function createVariableTagHTML(variable, keyLabelMap) {
  let labels = keyLabelMap.get(variable);

  if (labels) {
    labels = labels.map((label) => {
      if (isReactElement(label)) {
        return renderToString(label);
      }
      return label;
    });
  }

  return `<span class="ant-tag ant-tag-blue" contentEditable="false" data-variable="${variable}">${
    labels ? labels.join(' / ') : '...'
  }</span>`;
}

// [#, <>, #, #, <>]
// [#, #]
// [<>, #, #]
// [#, #, <>]
function getSingleEndRange(nodes: ChildNode[], index: number, offset: number): [number, number] {
  if (index === -1) {
    let realIndex = offset;
    let collapseFlag = false;
    if (realIndex && nodes[realIndex - 1]?.nodeName === '#text' && nodes[realIndex]?.nodeName === '#text') {
      // set a flag for collapse
      collapseFlag = true;
    }
    let textOffset = 0;
    for (let i = offset - 1; i >= 0; i--) {
      if (collapseFlag) {
        if (nodes[i]?.nodeName === '#text') {
          textOffset += nodes[i].textContent!.length;
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
        textOffset += i === index ? offset : nodes[i].textContent!.length;
      } else {
        realIndex += 1;
        textOffset = 0;
      }
    }
    return [realIndex, textOffset];
  }
}

function getCurrentRange(element: HTMLElement): RangeIndexes {
  const sel = window.getSelection?.();
  const range = sel?.getRangeAt(0);
  if (!range) {
    return [-1, 0, -1, 0];
  }
  const nodes = Array.from(element.childNodes);
  if (!nodes.length) {
    return [-1, 0, -1, 0];
  }

  const startElementIndex = range.startContainer === element ? -1 : nodes.indexOf(range.startContainer as HTMLElement);
  const endElementIndex = range.endContainer === element ? -1 : nodes.indexOf(range.endContainer as HTMLElement);

  const result: RangeIndexes = [
    ...getSingleEndRange(nodes, startElementIndex, range.startOffset),
    ...getSingleEndRange(nodes, endElementIndex, range.endOffset),
  ];
  return result;
}

const defaultFieldNames = { value: 'value', label: 'label' };

function useVariablesFromValue(value: string, delimiters: [string, string] = ['{{', '}}']) {
  const delimitersString = delimiters.join(' ');
  return useMemo(() => {
    if (!value?.trim()) {
      return [];
    }
    const variableRegExp = new RegExp(`${delimiters[0]}\\s*([^{}]+)\\s*${delimiters[1]}`, 'g');
    const matches = value.match(variableRegExp);
    return matches?.map((m) => m.replace(variableRegExp, '$1')) ?? [];
  }, [value, delimitersString]);
}

export type TextAreaProps = {
  value?: string;
  scope?: Partial<DefaultOptionType>[] | (() => Partial<DefaultOptionType>[]);
  onChange?(value: string): void;
  disabled?: boolean;
  changeOnSelect?: CascaderProps['changeOnSelect'];
  style?: React.CSSProperties;
  fieldNames?: CascaderProps['fieldNames'];
  trim?: boolean;
  delimiters?: [string, string];
  addonBefore?: React.ReactNode;
};

export function TextArea(props: TextAreaProps) {
  const { wrapSSR, hashId, componentCls } = useStyles();
  const { scope, changeOnSelect, style, fieldNames, delimiters = ['{{', '}}'], addonBefore, trim = true } = props;
  const value =
    typeof props.value === 'string' ? props.value : props.value == null ? '' : (props.value as any).toString();
  const variables = useVariablesFromValue(value, delimiters);
  const inputRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState([]);
  const form = useForm();
  const keyLabelMap = useMemo(
    () => createOptionsValueLabelMap(options, fieldNames || defaultFieldNames),
    [fieldNames, options],
  );
  const [ime, setIME] = useState<boolean>(false);
  const [changed, setChanged] = useState(false);
  const [html, setHtml] = useState(() => renderHTML(value ?? '', keyLabelMap, delimiters));
  // NOTE: e.g. [startElementIndex, startOffset, endElementIndex, endOffset]
  const [range, setRange] = useState<[number, number, number, number]>([-1, 0, -1, 0]);
  useInputStyle('ant-input');
  const { token } = theme.useToken();
  const delimitersString = delimiters.join(' ');

  const onChange = useCallback(
    (target: HTMLDivElement) => {
      const v = getValue(target, delimiters);
      props.onChange?.(trim ? v.trim() : v);
    },
    [delimitersString, props.onChange, trim],
  );

  useEffect(() => {
    preloadOptions(scope, variables)
      .then((preloaded) => {
        setOptions(preloaded);
      })
      .catch(console.error);
  }, [scope, JSON.stringify(variables)]);

  useEffect(() => {
    setHtml(renderHTML(value ?? '', keyLabelMap, delimiters));
    if (!changed) {
      setRange([-1, 0, -1, 0]);
    }
  }, [value, keyLabelMap, delimitersString]);

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

  const onInsert = useCallback(
    function (paths: string[]) {
      const variable: string[] = paths.filter((key) => Boolean(key.trim()));
      const { current } = inputRef;
      if (!current || !variable) {
        return;
      }

      current.focus();

      const content = createVariableTagHTML(variable.join('.'), keyLabelMap);
      pasteHTML(current, content, {
        range,
      });

      setChanged(true);
      setRange(getCurrentRange(current));
      onChange(current);
    },
    [keyLabelMap, onChange, range],
  );

  const onInput = useCallback(
    function ({ currentTarget }) {
      if (ime) {
        return;
      }
      setChanged(true);
      setRange(getCurrentRange(currentTarget));
      onChange(currentTarget);
    },
    [ime, onChange],
  );

  const onBlur = useCallback(function ({ currentTarget }) {
    setRange(getCurrentRange(currentTarget));
  }, []);

  const onKeyDown = useCallback(function (ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
    }
  }, []);

  const onCompositionStart = useCallback(function () {
    setIME(true);
  }, []);

  const onCompositionEnd = useCallback(
    ({ currentTarget }) => {
      setIME(false);
      setChanged(true);
      setRange(getCurrentRange(currentTarget));
      onChange(currentTarget);
    },
    [onChange],
  );

  const onPaste = useCallback(
    function (ev) {
      ev.preventDefault();
      const input = ev.clipboardData.getData('text/html') || ev.clipboardData.getData('text');
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
            return attribs['data-variable']
              ? {
                  tagName: tagName,
                  attribs,
                }
              : {};
          },
        },
      }).replace(/\n/g, ' ');
      // ev.clipboardData.setData('text/html', sanitizedHTML);
      // console.log(input, sanitizedHTML);
      setChanged(true);
      pasteHTML(ev.currentTarget, sanitizedHTML);
      setRange(getCurrentRange(ev.currentTarget));
      onChange(ev.currentTarget);
    },
    [onChange],
  );
  const disabled = props.disabled || form.disabled;
  return wrapSSR(
    <>
      <Space.Compact
        className={cx(
          componentCls,
          hashId,
          css`
            display: flex;
            .ant-input {
              flex-grow: 1;
              min-width: 200px;
              word-break: break-all;
              border-top-left-radius: ${addonBefore ? '0px' : '6px'};
              border-bottom-left-radius: ${addonBefore ? '0px' : '6px'};
            }
            .ant-input-disabled {
              .ant-tag {
                color: #bfbfbf;
                border-color: #d9d9d9;
              }
            }

            > .x-button {
              height: min-content;
            }
          `,
        )}
      >
        {addonBefore && (
          <div
            className={css`
              background: rgba(0, 0, 0, 0.02);
              border: 1px solid rgb(217, 217, 217);
              padding: 0px 11px;
              border-radius: 6px 0px 0px 6px;
              border-right: 0px;
            `}
          >
            {addonBefore}
          </div>
        )}
        <div
          role="button"
          aria-label="textbox"
          onInput={onInput}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          // should use data-placeholder here, but not sure if it is safe to make the change, so add ignore here
          // @ts-ignore
          placeholder={props.placeholder}
          style={style}
          className={cx(
            hashId,
            'ant-input ant-input-outlined',
            { 'ant-input-disabled': disabled },
            // NOTE: `pre-wrap` here for avoid the `&nbsp;` (\x160) issue when paste content, we need normal space (\x32).
            css`
              min-height: ${token.controlHeight}px;
              overflow: auto;
              white-space: pre-wrap;

              &[placeholder]:empty::before {
                content: attr(placeholder);
                color: #ccc;
              }

              .ant-tag {
                display: inline;
                line-height: 19px;
                margin: 0 0.5em;
                padding: 2px 7px;
                border-radius: 10px;
              }
            `,
          )}
          ref={inputRef}
          contentEditable={!disabled}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <VariableSelect
          options={options}
          setOptions={setOptions}
          onInsert={onInsert}
          changeOnSelect={changeOnSelect}
          fieldNames={fieldNames || defaultFieldNames}
          disabled={disabled}
        />
      </Space.Compact>
      {/* 确保所有ant input样式都已加载, 放到Compact中会导致Compact中的Input样式不对 */}
      <AntInput style={{ display: 'none' }} />
    </>,
  );
}

async function preloadOptions(scope, variables: string[]) {
  let options = [...(scope ?? [])];
  const paths = variables.map((variable) => variable.split('.'));
  options = options.filter((item) => {
    return !item.deprecated || paths.find((p) => p[0] === item.value);
  });

  for (const keys of paths) {
    let prevOption = null;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        if (i === 0) {
          prevOption = options.find((item) => item.value === key);
        } else {
          if (prevOption.loadChildren && !prevOption.children?.length) {
            await prevOption.loadChildren(prevOption, key, keys);
          }
          prevOption = prevOption.children.find((item) => item.value === key);
        }
      } catch (err) {
        error(err);
      }
    }
  }
  return options;
}

const textAreaReadPrettyClassName = css`
  overflow: auto;

  .ant-tag {
    display: inline;
    line-height: 19px;
    margin: 0 0.25em;
    padding: 2px 7px;
    border-radius: 10px;
  }
`;

TextArea.ReadPretty = function ReadPretty(props): JSX.Element {
  const { value, delimiters = ['{{', '}}'] } = props;
  const scope = typeof props.scope === 'function' ? props.scope() : props.scope;
  const { wrapSSR, hashId, componentCls } = useStyles();
  const [options, setOptions] = useState([]);
  const keyLabelMap = useMemo(() => createOptionsValueLabelMap(options), [options]);
  const html = useMemo(() => renderHTML(value ?? '', keyLabelMap, delimiters), [delimiters, keyLabelMap, value]);
  const variables = useVariablesFromValue(value, delimiters);
  useEffect(() => {
    preloadOptions(scope, variables)
      .then((preloaded) => {
        setOptions(preloaded);
      })
      .catch(error);
  }, [scope, variables]);

  const content = wrapSSR(
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      className={cx(componentCls, hashId, textAreaReadPrettyClassName)}
    />,
  );

  return (
    <EllipsisWithTooltip ellipsis popoverContent={content}>
      {content}
    </EllipsisWithTooltip>
  );
};
