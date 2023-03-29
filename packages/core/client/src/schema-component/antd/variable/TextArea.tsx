import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input, Cascader, Tooltip, Button } from 'antd';
import { useForm } from '@formily/react';
import { cx, css } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../..';

const VARIABLE_RE = /{{\s*([^{}]+)\s*}}/g;

function pasteHtml(container, html, { selectPastedContent = false, range: indexes }) {
  // IE9 and non-IE
  const sel = window.getSelection?.();
  if (!sel?.getRangeAt || !sel.rangeCount) {
    return;
  }
  const range = sel.getRangeAt(0);
  if (!range) {
    return;
  }
  const children = Array.from(container.childNodes) as HTMLElement[];
  if (indexes[0] === -1) {
    if (indexes[1]) {
      range.setStartAfter(children[indexes[1] - 1]);
    }
  } else {
    range.setStart(children[indexes[0]], indexes[1]);
  }

  if (indexes[2] === -1) {
    if (indexes[3]) {
      range.setEndAfter(children[indexes[3] - 1]);
    }
  } else {
    range.setEnd(children[indexes[2]], indexes[3]);
  }
  range.deleteContents();

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
  range.insertNode(frag);

  // Preserve the selection
  if (lastNode) {
    const next = range.cloneRange();
    next.setStartAfter(lastNode);
    if (selectPastedContent) {
      if (firstChild) {
        next.setStartBefore(firstChild);
      }
    } else {
      next.collapse(true);
    }
    sel.removeAllRanges();
    sel.addRange(next);
  }
}

function getValue(el) {
  const values: any[] = [];
  for (const node of el.childNodes) {
    if (node.nodeName === 'SPAN') {
      values.push(`{{${node['dataset']['key']}}}`);
    } else {
      values.push(node.textContent?.trim?.());
    }
  }
  return values.join('');
}

function renderHTML(exp: string, keyLabelMap) {
  return exp.replace(VARIABLE_RE, (_, i) => {
    const key = i.trim();
    return createVariableTagHTML(key, keyLabelMap) ?? '';
  });
}

function createOptionsValueLabelMap(options: any[]) {
  const map = new Map<string, string[]>();
  for (const option of options) {
    map.set(option.value, [option.label]);
    if (option.children) {
      for (const [value, labels] of createOptionsValueLabelMap(option.children)) {
        map.set(`${option.value}.${value}`, [option.label, ...labels]);
      }
    }
  }
  return map;
}

function createVariableTagHTML(variable, keyLabelMap) {
  const labels = keyLabelMap.get(variable);
  return `<span class="ant-tag ant-tag-blue" contentEditable="false" data-key="${variable}">${labels?.join(
    ' / ',
  )}</span>`;
}

function getLatestRange(element: HTMLElement): [number, number, number, number] {
  const sel = window.getSelection?.();
  const range = sel?.getRangeAt(0);
  if (!range) {
    return [-1, 0, -1, 0];
  }
  const nodes = Array.from(element.childNodes);
  const startElementIndex = range.startContainer === element ? -1 : nodes.indexOf(range.startContainer as HTMLElement);
  const endElementIndex = range.endContainer === element ? -1 : nodes.indexOf(range.endContainer as HTMLElement);
  return [startElementIndex, range.startOffset, endElementIndex, range.endOffset];
}

export function TextArea(props) {
  const { value = '', scope, onChange, multiline = true, button } = props;
  const compile = useCompile();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLDivElement>(null);
  const options = compile((typeof scope === 'function' ? scope() : scope) ?? []);
  const form = useForm();
  const keyLabelMap = useMemo(() => createOptionsValueLabelMap(options), [scope]);
  const [ime, setIME] = useState<boolean>(false);
  const [changed, setChanged] = useState(false);
  const [html, setHtml] = useState(() => renderHTML(value ?? '', keyLabelMap));
  // NOTE: e.g. [startElementIndex, startOffset, endElementIndex, endOffset]
  const [range, setRange] = useState<[number, number, number, number]>([-1, 0, -1, 0]);

  useEffect(() => {
    setHtml(renderHTML(value ?? '', keyLabelMap));
  }, [value]);

  useEffect(() => {
    const { current } = inputRef;
    if (!current) {
      return;
    }
    const nextRange = new Range();
    if (changed) {
      const sel = window.getSelection?.();
      if (sel) {
        const children = Array.from(current.childNodes) as HTMLElement[];
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
        nextRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(nextRange);
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

  function onInsert(keyPath) {
    const variable: string[] = keyPath.filter((key) => Boolean(key.trim()));
    const { current } = inputRef;
    if (!current || !variable) {
      return;
    }

    current.focus();

    pasteHtml(current, createVariableTagHTML(variable.join('.'), keyLabelMap), {
      range,
    });

    setChanged(true);
    setRange(getLatestRange(current));
    onChange(getValue(current));
  }

  function onInput({ currentTarget }) {
    if (ime) {
      return;
    }
    setChanged(true);
    setRange(getLatestRange(currentTarget));
    onChange(getValue(currentTarget));
  }

  function onBlur({ currentTarget }) {
    setRange(getLatestRange(currentTarget));
  }

  const disabled = props.disabled || form.disabled;

  return (
    <Input.Group
      compact
      className={css`
        &.ant-input-group.ant-input-group-compact {
          display: flex;
          .ant-input {
            flex-grow: 1;
            min-width: 200px;
          }
          .ant-input-disabled {
            .ant-tag {
              color: #bfbfbf;
              border-color: #d9d9d9;
            }
          }
        }
      `}
    >
      <div
        onInput={onInput}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
          setIME(e.keyCode === 229);
        }}
        className={cx(
          'ant-input',
          { 'ant-input-disabled': disabled },
          css`
            overflow: auto;
            white-space: ${multiline ? 'normal' : 'nowrap'};

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
      <Tooltip title={t('Use variable')}>
        <Cascader value={[]} options={options} onChange={onInsert}>
          {button ?? (
            <Button
              className={css`
                font-style: italic;
                font-family: 'New York', 'Times New Roman', Times, serif;
              `}
            >
              x
            </Button>
          )}
        </Cascader>
      </Tooltip>
    </Input.Group>
  );
}
