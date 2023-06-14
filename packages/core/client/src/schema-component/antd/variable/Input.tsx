import { CloseCircleFilled } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { useForm } from '@formily/react';
import { Input as AntInput, Cascader, DatePicker, InputNumber, Select, Tag } from 'antd';
import moment from 'moment';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { error } from '@nocobase/utils/client';
import classNames from 'classnames';
import { useMemo } from 'react';
import { useCompile } from '../..';
import { Option } from '../../../schema-settings/VariableInput/type';
import { XButton } from './XButton';

const JT_VALUE_RE = /^\s*{{\s*([^{}]+)\s*}}\s*$/;
const groupClass = css`
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
`;
const userSelectNone = css`
  user-select: 'none';
`;

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
  const parsed = useMemo(() => parseValue(value), [value]);
  const isConstant = typeof parsed === 'string';
  const type = isConstant ? parsed : '';
  const variable = isConstant ? null : parsed;

  // 当 scope 是一个函数时，可能是一个 hook，所以不能使用 useMemo
  const variableOptions = typeof scope === 'function' ? scope() : scope ?? [];

  const [variableText, setVariableText] = React.useState('');

  const { component: ConstantComponent, ...constantOption }: VariableOptions & { component?: React.FC<any> } =
    useMemo(() => {
      if (children) {
        return {
          value: '',
          label: '{{t("Constant")}}',
        };
      }
      if (useTypedConstant) {
        return getTypedConstantOption(type, useTypedConstant);
      }
      return {
        value: '',
        label: '{{t("Null")}}',
        component: ConstantTypes.null.component,
      };
    }, [type, useTypedConstant]);

  const [options, setOptions] = React.useState<VariableOptions[]>(() => {
    return compile([constantOption, ...variableOptions]);
  });

  useEffect(() => {
    const newOptions: Option[] = [constantOption, ...variableOptions];
    const compiled = compile(newOptions);

    // 由于 compile 用了缓存功能以优化性能，但是会导致这里返回的还是老的对象，导致 loadChildren 不是最新的，所以这里需要手动更新
    compiled.forEach((item: Option, index) => {
      if (item.loadChildren) {
        item.loadChildren = newOptions[index].loadChildren;
      }
    });

    setOptions(compiled);
  }, [variableOptions]);

  const loadData = async (selectedOptions: Option[]) => {
    const option = selectedOptions[selectedOptions.length - 1];
    if (option.loadChildren) {
      await option.loadChildren(option);
    }
  };

  const onSwitch = useCallback(
    (next) => {
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
    },
    [type, variable],
  );

  useEffect(() => {
    const run = async () => {
      if (!variable || options.length <= 1) {
        return;
      }
      let prevOption: Option = null;
      const labels = [];

      for (let i = 0; i < variable.length; i++) {
        const key = variable[i];
        try {
          if (i === 0) {
            prevOption = options.find((item) => item.value === key);
          } else {
            if (prevOption.loadChildren) {
              await prevOption.loadChildren(prevOption);
            }
            prevOption = prevOption.children.find((item) => item.value === key);
          }
          labels.push(prevOption.label);
        } catch (err) {
          error(err);
        }
      }
      setOptions([...options]);
      setVariableText(labels.join(' / '));
    };

    // 如果没有这个延迟，会导致选择父节点时不展开子节点
    setTimeout(run);
  }, [variable, options.length]);

  const disabled = props.disabled || form.disabled;

  return (
    <AntInput.Group compact style={style} className={classNames(className, groupClass)}>
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
              className={cx('ant-select-clear', userSelectNone)}
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
          loadData={loadData as any}
          changeOnSelect
        >
          {button ?? <XButton type={variable ? 'primary' : 'default'} />}
        </Cascader>
      ) : null}
    </AntInput.Group>
  );
}
