import { Field, onFormSubmitValidateStart } from '@formily/core';
import { useField, useFormEffects } from '@formily/react';
import { Dropdown, Menu } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ContentEditable from 'react-contenteditable';
import { useTranslation } from 'react-i18next';

export const Expression = (props) => {
  const { evaluate, value, onChange, supports, useCurrentFields } = props;
  const field = useField<Field>();
  const { t } = useTranslation();
  const fields = useCurrentFields();

  const inputRef = useRef();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [html, setHtml] = useState<any>(null);

  const numColumns = new Map<string, string>();
  const scope = {};
  fields
    .filter((field) => supports.includes(field.interface))
    .forEach((field) => {
      numColumns.set(field.name, field.uiSchema.title);
      scope[field.name] = 1;
    });
  const keys = Array.from(numColumns.keys());

  useEffect(() => {
    if (value) {
      let newHtml = value;
      numColumns.forEach((value, key) => {
        newHtml = newHtml.replaceAll(
          key,
          `<span contentEditable="false" ><input disabled="disabled" style="width:${
            18 * value.length
          }px;max-width: 120px" value="${value}"/><span hidden>${key}</span></span>`,
        );
      });
      newHtml = `${newHtml}<span style="padding-left: 5px"></span>`; // set extra span for cursor focus on last position
      setHtml(newHtml);
    } else {
      setHtml('');
    }
  }, [value]);

  const menu = (
    <Menu
      onClick={async (args) => {
        const replaceFormula = field.value.replace('@', args.key);
        if (onChange && replaceFormula != field.value) {
          onChange(replaceFormula);
        }
        setDropdownVisible(false);
        (inputRef.current as any).focus();
      }}
    >
      {keys.map((key) => (
        <Menu.Item key={key}>{numColumns.get(key)}</Menu.Item>
      ))}
    </Menu>
  );

  const handleChange = (e) => {
    if (onChange) {
      if (e.currentTarget.textContent == '') {
        onChange(null);
      } else {
        onChange(e.currentTarget.textContent);
      }
    }
  };

  const handleKeyDown = (e) => {
    const { key } = e;
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
  };

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
    <Dropdown overlay={menu} visible={dropdownVisible}>
      <ContentEditable
        innerRef={inputRef as any}
        className="ant-input"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        html={html || ''}
      />
    </Dropdown>
  );
};

export default Expression;
