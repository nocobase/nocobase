import { CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { useFormLayout } from '@formily/antd';
import { connect, mapProps, mapReadPretty, useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import { useRecord } from '@nocobase/client';
import { Button, Input, Popover, Tag, Menu, Dropdown } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ContentEditable from 'react-contenteditable';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../../collection-manager/hooks';
import { hasIcon, Icon, icons } from '../../../icon';

const AntdFormulaInput = (props) => {
  const { value, onChange } = props;
  console.log('p', props);
  const record = useRecord();
  const { getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(record.collectionName || record.name) as any[];

  const inputRef = useRef();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [formula, setFormula] = useState(null);
  const [html, setHtml] = useState(null);

  const numColumns = new Map<string, string>();
  fields.filter(field => field.interface === 'number').forEach(field => {
    numColumns.set(field.name, field.uiSchema.title);
  })
  const keys = Array.from(numColumns.keys());

  let initHtml;
  if (value) {
    initHtml = value;
    numColumns.forEach((value, key) => {
      initHtml = initHtml.replaceAll(key, `<span contentEditable="false" style="border: 1px solid #aaa; padding: 2px 5px;">${value}</span>`)
    })    
  }

  useEffect(() => {
    if (onChange && formula) {
      let v = formula;
      console.log('a', formula, html);
      numColumns.forEach((value, key) => {
        v = v.replaceAll(value, key);
      })
      if (v != value) {
        onChange(v);
      }
    }

    // if (value && !formula) {
    //   console.log('v1', value);
    //   let v = value;
    //   let h = value;
    //   numColumns.forEach((value, key) => {
    //     v = v.replaceAll(key, value);
    //     h = h.replaceAll(key, `<span contentEditable="false" style="border: 1px solid #aaa; padding: 2px 5px;">${value}</span>`)
    //   })
    //   setFormula(v);
    //   setHtml(h);
    // }
  }, [formula])

  const menu = (
    <Menu onClick={async (args) => {
      // document.execCommand("insertHTML", false, '<span contentEditable="false">123</span>');
      const replaceFormula = formula.replace('@', numColumns.get(args.key));
      const replaceHtml = html.replace('@', `<span contentEditable="false" style="border: 1px solid #aaa; padding: 2px 5px;">${numColumns.get(args.key)}</span>`);
      setFormula(replaceFormula);
      setHtml(replaceHtml);
      setDropdownVisible(false);
    }}>
      {
        keys.map(key => (<Menu.Item key={key}>{numColumns.get(key)}</Menu.Item>))
      }
    </Menu>
  );

  const handleChange = (e) => {
    const current = inputRef.current as any;
    setFormula(e.currentTarget.textContent);
    setHtml(current.innerHTML);
  }

  const handleKeyDown = (e) => {
    const {key} = e;
    switch (key) {
      case 'Enter':
        e.preventDefault();
        break;
      case '@':
      case 'Process':
        setDropdownVisible(true);
        break;
      default:
        setDropdownVisible(false);
        break;
    }
  }

  return (
    <Dropdown overlay={menu} visible={dropdownVisible}>
      <ContentEditable
        innerRef={inputRef}
        className="ant-input"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        html={html || initHtml || ''}
      />
    </Dropdown>
  )
}

export const FormulaInput = connect(
  AntdFormulaInput,
  mapProps(),
);

export default FormulaInput;