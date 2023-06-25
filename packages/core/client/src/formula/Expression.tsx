import { css } from '@emotion/css';
import { Field, onFormSubmitValidateStart } from '@formily/core';
import { useField, useFormEffects } from '@formily/react';
import { Dropdown, MenuProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

function pasteHtml(html, selectPastedContent = false) {
  let sel, range;
  if (window.getSelection) {
    // IE9 and non-IE
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      range = sel.getRangeAt(0);
      range.deleteContents();

      // Range.createContextualFragment() would be useful here but is
      // only relatively recently standardized and is not supported in
      // some browsers (IE9, for one)
      const el = document.createElement('div');
      el.innerHTML = html;
      let frag = document.createDocumentFragment(),
        node,
        lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      const firstNode = frag.firstChild;
      range.insertNode(frag);

      // Preserve the selection
      if (lastNode) {
        range = range.cloneRange();
        range.setStartAfter(lastNode);
        if (selectPastedContent) {
          range.setStartBefore(firstNode);
        } else {
          range.collapse(true);
        }
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }
}

const getValue = (el) => {
  const values: any[] = [];
  for (const node of el.childNodes) {
    if (node.nodeName === 'SPAN') {
      values.push(`{{${node['dataset']['key']}}}`);
    } else {
      values.push(node.textContent?.trim?.());
    }
  }
  const text = values.join(' ')?.replace(/\s+/g, ' ').trim();
  return ` ${text} `;
};

const renderExp = (exp: string, scope = {}) => {
  return exp.replace(/{{([^}]+)}}/g, (_, i) => {
    return scope[i.trim()] || '';
  });
};

export const Expression = (props) => {
  const { evaluate, value, supports, useCurrentFields } = props;
  const field = useField<Field>();
  const { t } = useTranslation();
  const fields = useCurrentFields();
  const inputRef = useRef<any>();
  const [changed, setChanged] = useState(false);

  const onChange = useCallback(
    (value) => {
      setChanged(true);
      props.onChange(value);
    },
    [props.onChange],
  );

  const { numColumns, scope } = useMemo(() => {
    const numColumns = new Map<string, string>();
    const scope = {};
    fields
      .filter((field) => supports.includes(field.interface))
      .forEach((field) => {
        numColumns.set(field.name, field.uiSchema.title);
        scope[field.name] = 1;
      });

    return { numColumns, scope };
  }, [fields, supports]);

  const keys = Array.from(numColumns.keys());
  const [html, setHtml] = useState(() => {
    const scope = {};
    for (const key of keys) {
      const val = numColumns.get(key);
      scope[
        key
      ] = `  <span class="ant-tag" style="margin: 0 3px;" contentEditable="false" data-key="${key}">${val}</span>  `;
    }
    return renderExp(value || '', scope);
  });

  useEffect(() => {
    if (changed) {
      return;
    }
    const scope = {};
    for (const key of keys) {
      const val = numColumns.get(key);
      scope[
        key
      ] = `  <span class="ant-tag" style="margin: 0 3px;" contentEditable="false" data-key="${key}">${val}</span>  `;
    }
    const val = renderExp(value || '', scope);
    setHtml(val);
  }, [value]);

  const menuItems = useMemo<MenuProps['items']>(() => {
    if (keys.length > 0) {
      return keys.map((key) => ({
        key,
        disabled: true,
        label: (
          <button
            onClick={async (args) => {
              (inputRef.current as any).focus();
              const val = numColumns.get(key);
              pasteHtml(
                `  <span class="ant-tag" style="margin: 0 3px;" contentEditable="false" data-key="${key}">${val}</span>  `,
              );
              const text = getValue(inputRef.current);
              onChange(text);
            }}
          >
            {numColumns.get(key)}
          </button>
        ),
      }));
    } else {
      return [
        {
          key: 0,
          disabled: true,
          label: t('No available fields'),
        },
      ];
    }
  }, [keys, numColumns, onChange]);

  const menu = useMemo<MenuProps>(() => {
    return {
      items: menuItems,
    };
  }, [menuItems]);

  useFormEffects(() => {
    onFormSubmitValidateStart(() => {
      try {
        evaluate(field.value, scope);
        field.feedbacks = [];
      } catch (e) {
        console.error(field.value, scope, (e as Error).message);
        field.setFeedback({
          type: 'error',
          code: 'FormulaError',
          messages: [t('Formula error.')],
        });
      }
    });
  });

  return (
    <Dropdown
      trigger={['click']}
      menu={menu}
      overlayClassName={css`
        .ant-dropdown-menu-item {
          padding: 0;
        }
        button {
          cursor: pointer;
          padding: 5px 12px;
          text-align: left;
          color: rgba(0, 0, 0, 0.85);
          width: 100%;
          line-height: inherit;
          height: auto;
          border: 0px;
          background-color: transparent;
          &:hover {
            background-color: #f5f5f5;
          }
        }
      `}
    >
      <div
        onKeyDown={(e) => {
          const text = getValue(e.currentTarget);
          if (e.key === 'Backspace') {
            if (text && keys.map((k) => `{{${k}}}`).includes(text)) {
              inputRef.current.innerHTML = '  ';
            }
          }
        }}
        onKeyUp={(e) => {
          const text = getValue(e.currentTarget);
          if (e.key === 'Backspace') {
            // pasteHtml(' ');
          }
          onChange(text);
        }}
        // onClick={(e) => {
        //   const text = getValue(e.currentTarget);
        //   onChange(text);
        //   console.log('onChange', text);
        // }}
        onBlur={(e) => {
          const text = getValue(e.currentTarget);
          onChange(text);
        }}
        onInput={(e) => {
          const text = getValue(e.currentTarget);
          onChange(text);
        }}
        className={'ant-input'}
        style={{ display: 'block' }}
        ref={inputRef as any}
        contentEditable
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Dropdown>
  );
};

export default Expression;
