/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseCircleFilled } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { useForm } from '@formily/react';
import { error } from '@nocobase/utils/client';
import { Input as AntInput, Cascader, CascaderProps, DatePicker, InputNumber, Select, Space, Tag } from 'antd';
import useAntdInputStyle from 'antd/es/input/style';
import type { DefaultOptionType } from 'antd/lib/cascader';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks';
import { XButton } from './XButton';
import { useStyles } from './style';
import { Json } from '../input';

const JT_VALUE_RE = /^\s*{{\s*([^{}]+)\s*}}\s*$/;

type ParseOptions = {
  defaultTypeOnNull?: string;
  stringToDate?: boolean;
};

function parseValue(value: any, options: ParseOptions = {}): string | string[] {
  if (value == null) {
    return options.defaultTypeOnNull ?? 'null';
  }
  const type = typeof value;
  if (type === 'string') {
    const matched = value.match(JT_VALUE_RE);
    if (matched) {
      return matched[1].split('.');
    }
    if (options.stringToDate) {
      if (!Number.isNaN(Date.parse(value))) {
        return 'date';
      }
    }
  }
  return type === 'object' && value instanceof Date ? 'date' : type;
}

function NullComponent() {
  const { t } = useTranslation();
  return <AntInput style={{ width: '100%' }} readOnly placeholder={`<${t('Null')}>`} className="null-value" />;
}

const ConstantTypes = {
  string: {
    label: `{{t("String")}}`,
    value: 'string',
    component: function StringComponent({ onChange, value, ...otherProps }) {
      return <AntInput value={value} onChange={(ev) => onChange(ev.target.value)} {...otherProps} />;
    },
    default() {
      return '';
    },
  },
  number: {
    label: '{{t("Number")}}',
    value: 'number',
    component: function NumberComponent({ onChange, value, ...otherProps }) {
      return <InputNumber value={value} onChange={onChange} {...otherProps} />;
    },
    default() {
      return 0;
    },
  },
  boolean: {
    label: `{{t("Boolean")}}`,
    value: 'boolean',
    component: function BooleanComponent({ onChange, value, ...otherProps }) {
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
          {...otherProps}
          className={classNames(otherProps.className, 'auto-width')}
        />
      );
    },
    default() {
      return false;
    },
  },
  date: {
    label: '{{t("Date")}}',
    value: 'date',
    component: function DateComponent({ onChange, value, ...otherProps }) {
      return (
        <DatePicker
          value={dayjs(value)}
          onChange={(d) => (d ? onChange(d.toDate()) : null)}
          allowClear={false}
          showTime
          {...otherProps}
        />
      );
    },
    default() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    },
  },
  // NOTE: keep null option here for compatibility
  null: {
    label: '{{t("Null")}}',
    value: 'null',
    component: NullComponent,
    default() {
      return null;
    },
  },
  object: {
    label: '{{t("JSON")}}',
    value: 'object',
    component: Json,
    default() {
      return {};
    },
  },
};

type UseTypeConstantType = true | (string | [string, Record<string, any>])[];

function getTypedConstantOption(type: string, types: UseTypeConstantType, fieldNames) {
  const allTypes = Object.values(ConstantTypes).filter((item) => item.value !== 'null');
  const children = (
    types
      ? allTypes.filter(
          (item) =>
            (Array.isArray(types) &&
              types.filter((t) => (Array.isArray(t) ? t[0] === item.value : t === item.value)).length) ||
            types === true,
        )
      : allTypes
  ).map((item) =>
    Object.keys(fieldNames).reduce(
      (result, key) =>
        key in item
          ? Object.assign(result, {
              [fieldNames[key]]: item[key],
            })
          : result,
      { ...item },
    ),
  );
  return {
    value: ' ',
    label: '{{t("Constant")}}',
    children,
    [fieldNames.value]: ' ',
    [fieldNames.label]: '{{t("Constant")}}',
    [fieldNames.children]: children,
    component: ConstantTypes[type]?.component,
  };
}

export type VariableInputProps = {
  value?: string;
  scope?: Partial<DefaultOptionType>[] | (() => Partial<DefaultOptionType>[]);
  onChange: (value: string, optionPath?: any[]) => void;
  children?: any;
  button?: React.ReactElement;
  useTypedConstant?: UseTypeConstantType;
  nullable?: boolean;
  changeOnSelect?: CascaderProps['changeOnSelect'];
  fieldNames?: CascaderProps['fieldNames'];
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  parseOptions?: ParseOptions;
  hideVariableButton?: boolean;
  constantAbel?: boolean;
};

export function Input(props: VariableInputProps) {
  const {
    value = '',
    onChange,
    children,
    button,
    useTypedConstant,
    nullable = true,
    style,
    className,
    changeOnSelect,
    fieldNames,
    parseOptions,
    hideVariableButton,
    constantAbel = true,
  } = props;
  const scope = typeof props.scope === 'function' ? props.scope() : props.scope;
  const { wrapSSR, hashId, componentCls, rootPrefixCls } = useStyles({ hideVariableButton });

  // 添加 antd input 样式，防止样式缺失
  useAntdInputStyle(`${rootPrefixCls}-input`);

  const compile = useCompile();
  const { t } = useTranslation();
  const form = useForm();
  const [options, setOptions] = React.useState<DefaultOptionType[]>([]);
  const [variableText, setVariableText] = React.useState([]);
  const [isFieldValue, setIsFieldValue] = React.useState(
    hideVariableButton || (children && value != null ? true : false),
  );

  const parsed = useMemo(() => parseValue(value, parseOptions), [parseOptions, value]);
  const isConstant = typeof parsed === 'string';
  const type = isConstant ? parsed : '';
  const variable = isConstant ? null : parsed;
  // const [prevType, setPrevType] = React.useState<string>(type);
  const names = Object.assign(
    {
      label: 'label',
      value: 'value',
      children: 'children',
    },
    fieldNames ?? {},
  );

  const constantOption: DefaultOptionType & { component?: React.FC<any> } = useMemo(() => {
    if (!constantAbel) return null;
    if (children) {
      return {
        value: '$',
        label: t('Constant'),
        [names.value]: '$',
        [names.label]: t('Constant'),
      };
    }

    if (useTypedConstant) {
      return getTypedConstantOption(type, useTypedConstant, names);
    }
    return null;
  }, [type, useTypedConstant]);

  const ConstantComponent = constantOption?.component ?? NullComponent;
  const constantComponentProps = Array.isArray(useTypedConstant)
    ? (useTypedConstant.find((item) => Array.isArray(item) && item[0] === type)?.[1] as Record<string, any>) ?? {}
    : {};
  let cValue;
  if (value == null) {
    if (nullable) {
      if (children && isFieldValue) {
        cValue = ['$'];
      } else {
        cValue = [''];
      }
    } else {
      if (children) {
        cValue = ['$'];
      } else {
        cValue = [' ', type];
      }
    }
  } else {
    cValue = children ? ['$'] : [' ', type];
  }

  if (hideVariableButton) {
    cValue = ['$'];
  }

  useEffect(() => {
    const { component, ...cOption } = constantOption ?? {};
    const options = [
      ...(nullable
        ? [
            {
              value: '',
              label: t('Null'),
              [names.value]: '',
              [names.label]: t('Null'),
            },
          ]
        : []),
      ...(constantOption ? [compile(cOption)] : []),
      ...(scope ? [...scope] : []),
    ].filter((item) => {
      return !item.deprecated || variable?.[0] === item[names.value];
    });

    setOptions(options);
  }, [scope, variable, constantOption, nullable]);

  const loadData = async (selectedOptions: DefaultOptionType[]) => {
    const option = selectedOptions[selectedOptions.length - 1];
    if (!option.children?.length && !option.isLeaf && option.loadChildren) {
      let activeKey;
      if (variable && variable.length >= 2) {
        for (const key of variable) {
          if (key === option[names.value]) {
            activeKey = key;
            break;
          }
        }
      }
      await option.loadChildren(option, activeKey, variable);
      setOptions((prev) => [...prev]);
    }
  };

  const onSwitch = useCallback(
    (next, optionPath: any[]) => {
      if (next[0] === '$') {
        setIsFieldValue(true);
        if (variable) {
          onChange(null, optionPath);
        }
        return;
      } else {
        setIsFieldValue(false);
      }
      if (next[0] === '') {
        onChange(null);
        return;
      }
      if (next[0] === ' ') {
        if (next[1]) {
          if (next[1] !== type) {
            // setPrevType(next[1]);
            onChange(ConstantTypes[next[1]]?.default?.() ?? null, optionPath);
          }
        } else {
          if (variable) {
            onChange(null, optionPath);
          }
        }
        return;
      }
      onChange(`{{${next.join('.')}}}`, optionPath);
    },
    [type, variable, onChange],
  );

  const onClearVariable = useCallback(() => {
    setIsFieldValue(Boolean(children));
    if (constantOption?.children?.length) {
      const v = constantOption.children[0].default();
      return onChange(v);
    }
    onChange(null);
  }, [constantOption]);

  useEffect(() => {
    const run = async () => {
      if (!variable || options.length <= 1) {
        return;
      }
      let prevOption: DefaultOptionType = null;
      const labels = [];

      for (let i = 0; i < variable.length; i++) {
        const key = variable[i];
        try {
          if (i === 0) {
            prevOption = options.find((item) => item[names.value] === key);
          } else {
            if (prevOption.loadChildren && !prevOption.children?.length) {
              await prevOption.loadChildren(prevOption, key, variable);
            }
            prevOption = prevOption.children.find((item) => item[names.value] === key);
          }

          // 如果为空则说明相关字段已被删除
          // fix T-1565
          if (!prevOption) {
            return;
          }

          labels.push(prevOption[names.label]);
        } catch (err) {
          error(err);
        }
      }
      setOptions([...options]);
      setVariableText([...labels]);
    };

    run();
    // NOTE: watch `options.length` and it only happens once
  }, [variable, options.length]);

  const disabled = props.disabled || form.disabled;

  return wrapSSR(
    <>
      <Space.Compact style={style} className={classNames(componentCls, hashId, className)}>
        {variable ? (
          <div
            className={cx(
              'variable',
              css`
                position: relative;
                line-height: 0;

                &:hover {
                  .clear-button {
                    display: inline-block;
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
              `,
            )}
          >
            <div
              role="button"
              aria-label="variable-tag"
              style={{ overflow: 'hidden' }}
              className={cx('ant-input ant-input-outlined', { 'ant-input-disabled': disabled }, hashId)}
            >
              <Tag color="blue">
                {variableText.map((item, index) => {
                  return (
                    <React.Fragment key={item}>
                      {index ? ' / ' : ''}
                      {item}
                    </React.Fragment>
                  );
                })}
              </Tag>
            </div>
            {!disabled ? (
              <span
                role="button"
                aria-label="icon-close"
                className={cx('clear-button')}
                // eslint-disable-next-line react/no-unknown-property
                unselectable="on"
                onClick={onClearVariable}
              >
                <CloseCircleFilled />
              </span>
            ) : null}
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            {children && (isFieldValue || !nullable) ? (
              children
            ) : ConstantComponent ? (
              <ConstantComponent
                role="button"
                aria-label="variable-constant"
                {...constantComponentProps}
                value={value}
                onChange={onChange}
              />
            ) : null}
          </div>
        )}
        {hideVariableButton ? null : (
          <Cascader
            options={options}
            value={variable ?? cValue}
            onChange={onSwitch}
            loadData={loadData as any}
            changeOnSelect={changeOnSelect ?? true}
            fieldNames={fieldNames}
            disabled={disabled}
          >
            {button ?? (
              <XButton
                className={css(`
              margin-left: -1px;
            `)}
                type={variable ? 'primary' : 'default'}
                disabled={disabled}
              />
            )}
          </Cascader>
        )}
      </Space.Compact>
      {/* 确保所有ant input样式都已加载, 放到Compact中会导致Compact中的Input样式不对 */}
      <AntInput style={{ display: 'none' }} />
    </>,
  );
}
