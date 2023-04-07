import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input, Cascader, Button } from 'antd';
import { useForm } from '@formily/react';
import { cx, css } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import * as sanitizeHTML from 'sanitize-html';

import { useCompile } from '../..';

type RangeIndexes = [number, number, number, number];

const VARIABLE_RE = /{{\s*([^{}]+)\s*}}/g;

function pasteHTML(container: HTMLElement, html: string, { selectPastedContent = false, range: indexes }: { selectPastedContent?: boolean; range?: RangeIndexes } = {}) {
  // IE9 and non-IE
  const sel = window.getSelection?.();
  const range = sel?.getRangeAt(0);
  if (!range) {
    return;
  }

  if (indexes) {
    const children = Array.from(container.childNodes);
    if (indexes[0] === -1) {
      if (indexes[1]) {
        range.setStartAfter(children[indexes[1] - 1]);
      } else {
        range.setStart(container, 0);
      }
    } else {
      range.setStart(children[indexes[0]], indexes[1]);
    }

    if (indexes[2] === -1) {
      if (indexes[3]) {
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

function getValue(el) {
  const values: any[] = [];
  for (const node of el.childNodes) {
    if (node.nodeName === 'SPAN' && node['dataset']['variable']) {
      values.push(`{{${node['dataset']['variable']}}}`);
    } else {
      values.push(node.textContent);
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
  return `<span class="ant-tag ant-tag-blue" contentEditable="false" data-variable="${variable}">${labels?.join(
    ' / ',
  )}</span>`;
}

// [#, <>, #, #, <>]
// [#, #]
// [<>, #, #]
// [#, #, <>]
function getSingleEndRange(nodes: ChildNode[], index: number, offset: number): [number, number] {
  if (index === -1) {
    let realIndex = offset;
    let collapseFlag = false;
    if (realIndex && nodes[realIndex - 1].nodeName === '#text' && nodes[realIndex]?.nodeName === '#text') {
      // set a flag for collapse
      collapseFlag = true;
    }
    let textOffset = 0;
    for (let i = offset - 1; i >= 0; i--) {
      if (collapseFlag) {
        if (nodes[i].nodeName === '#text') {
          textOffset += nodes[i].textContent!.length;
        } else {
          collapseFlag = false;
        }
      }
      if (nodes[i].nodeName === '#text' && nodes[i + 1]?.nodeName === '#text') {
        realIndex -= 1;
      }
    }

    return textOffset ? [realIndex, textOffset] : [-1, realIndex];
  } else {
    let realIndex = 0;
    let textOffset = 0;
    for (let i = 0; i < index + 1; i++) {
      // console.log(i, realIndex, textOffset);
      if (nodes[i].nodeName === '#text') {
        if (i !== index && nodes[i + 1] && nodes[i + 1].nodeName !== '#text') {
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

  const result: RangeIndexes = [...getSingleEndRange(nodes, startElementIndex, range.startOffset), ...getSingleEndRange(nodes, endElementIndex, range.endOffset)];
  return result;
}

export function TextArea(props) {
  const { value = '', scope, onChange, multiline = true } = props;
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
  const [selectedVar, setSelectedVar] = useState<string[]>([]);

  useEffect(() => {
    setSelectedVar([]);
  }, [scope]);

  useEffect(() => {
    setHtml(renderHTML(value ?? '', keyLabelMap));
    if (!changed) {
      setRange([-1, 0, -1, 0]);
    }
  }, [value]);

  useEffect(() => {
    const { current } = inputRef;
    if (!current) {
      return;
    }
    const nextRange = new Range();
    if (changed) {
      setChanged(false);
      if (range.join() === '-1,0,-1,0') {
        return;
      }
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

  function onInsert(paths: string[]) {
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
    onChange(getValue(current));
  }

  function onInput({ currentTarget }) {
    if (ime) {
      return;
    }
    setChanged(true);
    setRange(getCurrentRange(currentTarget));
    onChange(getValue(currentTarget));
  }

  function onBlur({ currentTarget }) {
    setRange(getCurrentRange(currentTarget));
  }

  function onKeyDown(ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
    }
    setIME(ev.keyCode === 229);
    // if (ev.key === 'Control') {
    //   console.debug(getSelection().getRangeAt(0));
    // }
    // if (ev.key === 'Alt') {
    //   console.debug(getCurrentRange(ev.currentTarget));
    // }
  }

  function onPaste(ev) {
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
          return attribs['data-variable'] ? {
            tagName: tagName,
            attribs,
          } : {};
        }
      }
    }).replace(/\n/g, ' ');
    // ev.clipboardData.setData('text/html', sanitizedHTML);
    // console.log(input, sanitizedHTML);
    setChanged(true);
    pasteHTML(ev.currentTarget, sanitizedHTML);
    setRange(getCurrentRange(ev.currentTarget));
    onChange(getValue(ev.currentTarget));
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

        .x-button{
          .ant-select.ant-cascader{
            position: absolute;
            top: -1px;
            left: -1px;
            min-width: auto;
            width: calc(100% + 2px);
            height: calc(100% + 2px);
            overflow: hidden;
            opacity: 0;
          }
        }
      `}
    >
      <div
        onInput={onInput}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
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
      <Button className={cx('x-button', css`
        position: relative;
      `)}>
        <span
          className={css`
            font-style: italic;
            font-family: "New York", "Times New Roman", Times, serif;
          `}
        >x</span>
        <Cascader
          placeholder={t('Select a variable')}
          value={[]}
          options={options}
          onChange={(keyPaths = [], selectedOptions = []) => {
            setSelectedVar(keyPaths as string[]);
            if (!keyPaths.length) {
              return;
            }
            const option = selectedOptions[selectedOptions.length - 1];
            if (!option?.children?.length) {
              onInsert(keyPaths);
            }
          }}
          changeOnSelect
          onClick={(e: any) => {
            if (e.detail !== 2) {
              return;
            }
            for (let n = e.target; n && n !== e.currentTarget; n = n.parentNode) {
              if (Array.from(n.classList ?? []).includes('ant-cascader-menu-item')) {
                onInsert(selectedVar);
              }
            }
          }}
          dropdownClassName={css`
            .ant-cascader-menu{
              margin-bottom: 0;
            }
          `}
          dropdownRender={(menu) => (
            <>
              {menu}
              <div
                className={css`
                  padding: .5em;
                  border-top: 1px solid rgba(0, 0, 0, .06);
                  color: rgba(0, 0, 0, .45);
                `}
              >
                {t('Double click to choose entire object')}
              </div>
            </>
          )}
        />
      </Button>
    </Input.Group>
  );
}
