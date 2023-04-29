import { CloseCircleFilled } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { useForm } from '@formily/react';
import { Input as AntInput, Cascader, DatePicker, InputNumber, Select, Tag } from 'antd';
import moment from 'moment';
import React from 'react';
import { useTranslation } from 'react-i18next';

import classNames from 'classnames';
import { useCompile } from '../..';
import { XButton } from './XButton';

const JT_VALUE_RE = /^\s*{{\s*([^{}]+)\s*}}\s*$/;

function parseValue(value: any): string | string[] {
  if (value == null) {
    return 'null';
  }
  const type = typeof value;
  if (type === 'string') {
    const matched = value.match(JT_VALUE_RE);
    if (matched) {
      return matched[1].split('.');
    }
    // const ts = Date.parse(value);
    // if (value.match(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d{0,3})Z$/) && !Number.isNaN(Date.parse(value))) {
    //   return {
    //     type: 'date',
    //   };
    // }
  }
  return type === 'object' && value instanceof Date ? 'date' : type;
}

const ConstantTypes = {
  string: {
    label: `{{t("String")}}`,
    value: 'string',
    component: function StringComponent({ onChange, value }) {
      return <AntInput value={value} onChange={(ev) => onChange(ev.target.value)} />;
    },
    default: '',
  },
  number: {
    label: '{{t("Number")}}',
    value: 'number',
    component: function NumberComponent({ onChange, value }) {
      return <InputNumber value={value} onChange={onChange} />;
    },
    default: 0,
  },
  boolean: {
    label: `{{t("Boolean")}}`,
    value: 'boolean',
    component: function BooleanComponent({ onChange, value }) {
      const { t } = useTranslation();
      return (
        <Select
          value={value}
          onChange={onChange}
          placeholder={t('Select')}
          options={[
            { value: true, label: t('True') },
            { value: false, label: t('False') },
          ]}
        />
      );
    },
    default: false,
  },
  date: {
    label: '{{t("Date")}}',
    value: 'date',
    component: function DateComponent({ onChange, value }) {
      return (
        <DatePicker
          value={moment(value)}
          onChange={(d) => (d ? onChange(d.toDate()) : null)}
          allowClear={false}
          showTime
        />
      );
    },
    default: (() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    })(),
  },
  null: {
    label: `{{t("Null")}}`,
    value: 'null',
    component: function NullComponent() {
      const { t } = useTranslation();
      return <AntInput readOnly placeholder={t('Null')} className="null-value" />;
    },
    default: null,
  },
};

function getTypedConstantOption(type: string, types?: true | string[]) {
  const allTypes = Object.values(ConstantTypes);
  return {
    value: '',
    label: '{{t("Constant")}}',
    children: types
      ? allTypes.filter((item) => (Array.isArray(types) && types.includes(item.value)) || types === true)
      : allTypes,
    component: ConstantTypes[type]?.component,
  };
}

type VariableOptions = {
  value: string;
  label?: string;
  children?: VariableOptions[];
};

export function Input(props) {
  const compile = useCompile();
  const form = useForm();

  const { value = '', scope, onChange, children, button, useTypedConstant, style, className } = props;
  const parsed = parseValue(value);
  const isConstant = typeof parsed === 'string';
  const type = isConstant ? parsed : '';
  const variable = isConstant ? null : parsed;
  const variableOptions = typeof scope === 'function' ? scope() : scope ?? [];

  const { component: ConstantComponent, ...constantOption }: VariableOptions & { component?: React.FC<any> } = children
    ? {
        value: '',
        label: '{{t("Constant")}}',
      }
    : useTypedConstant
    ? getTypedConstantOption(type, useTypedConstant)
    : {
        value: '',
        label: '{{t("Null")}}',
        component: ConstantTypes.null.component,
      };
  const options: VariableOptions[] = compile([constantOption, ...variableOptions]);

  function onSwitch(next) {
    if (next[0] === '') {
      if (next[1]) {
        if (next[1] !== type) {
          onChange(ConstantTypes[next[1]]?.default ?? null);
        }
      } else {
        if (variable) {
          onChange(null);
        }
      }
      return;
    }
    onChange(`{{${next.join('.')}}}`);
  }

  const variableText = variable
    ?.reduce((opts, key, i) => {
      const option = (i ? (opts[i - 1] as VariableOptions)?.children : options)?.find((item) => item.value === key);
      return option ? opts.concat(option) : opts;
    }, [] as VariableOptions[])
    .map((item) => item.label)
    .join(' / ');

  const disabled = props.disabled || form.disabled;

  return (
    <AntInput.Group
      compact
      style={style}
      className={classNames(
        className,
        css`
          width: auto;
          display: flex !important;
          .ant-input-disabled {
            .ant-tag {
              color: #bfbfbf;
              border-color: #d9d9d9;
            }
          }
          .ant-input.null-value {
            width: 4em;
            min-width: 4em;
          }
        `,
      )}
    >
      {variable ? (
        <div
          className={css`
            position: relative;
            line-height: 0;

            &:hover {
              .ant-select-clear {
                opacity: 0.8;
              }
            }

            .ant-input {
              overflow: auto;
              white-space: nowrap;
              ${disabled ? '' : 'padding-right: 28px;'}

              .ant-tag {
                display: inline;
                line-height: 19px;
                margin: 0;
                padding: 2px 7px;
                border-radius: 10px;
              }
            }
          `}
        >
          <div
            onInput={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key !== 'Backspace') {
                e.preventDefault();
                return;
              }
              onChange(null);
            }}
            className={cx('ant-input', { 'ant-input-disabled': disabled })}
            contentEditable={!disabled}
            suppressContentEditableWarning
          >
            <Tag contentEditable={false} color="blue">
              {variableText}
            </Tag>
          </div>
          {!disabled ? (
            <span
              className={cx(
                'ant-select-clear',
                css`
                  user-select: 'none';
                `,
              )}
              // eslint-disable-next-line react/no-unknown-property
              unselectable="on"
              aria-hidden
              onClick={() => onChange(null)}
            >
              <CloseCircleFilled />
            </span>
          ) : null}
        </div>
      ) : (
        children ?? <ConstantComponent value={value} onChange={onChange} />
      )}
      {options.length > 1 ? (
        <Cascader
          options={options}
          value={variable ?? ['', ...(children || !constantOption.children?.length ? [] : [type])]}
          onChange={onSwitch}
          changeOnSelect
        >
          {button ?? <XButton type={variable ? 'primary' : 'default'} />}
        </Cascader>
      ) : null}
    </AntInput.Group>
  );
}
