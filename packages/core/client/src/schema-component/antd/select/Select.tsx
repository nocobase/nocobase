import { CloseCircleFilled, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { isValid, toArr } from '@formily/shared';
import { isPlainObject } from '@nocobase/utils/client';
import type { SelectProps } from 'antd';
import { Select as AntdSelect, Empty, Spin, Tag } from 'antd';
import React from 'react';
import { ReadPretty } from './ReadPretty';
import { FieldNames, defaultFieldNames, getCurrentOptions } from './utils';

type Props = SelectProps<any, any> & {
  objectValue?: boolean;
  onChange?: (v: any) => void;
  multiple: boolean;
  rawOptions: any[];
  fieldNames: FieldNames;
};

const isEmptyObject = (val: any) => !isValid(val) || (typeof val === 'object' && Object.keys(val).length === 0);

const ObjectSelect = (props: Props) => {
  const { value, options, onChange, fieldNames, mode, loading, rawOptions, defaultValue, ...others } = props;
  const toValue = (v: any) => {
    if (isEmptyObject(v)) {
      return;
    }
    const values = toArr(v)
      .filter((item) => item)
      .map((val) => {
        return isPlainObject(val) ? val[fieldNames.value] : val;
      });
    const currentOptions = getCurrentOptions(values, options, fieldNames)?.map((val) => {
      return {
        label: val[fieldNames.label],
        value: val[fieldNames.value],
      };
    });
    if (['tags', 'multiple'].includes(mode) || props.multiple) {
      return currentOptions;
    }
    return currentOptions.shift();
  };

  return (
    <AntdSelect
      // @ts-ignore
      role="button"
      data-testid={`select-object-${mode}`}
      value={toValue(value)}
      defaultValue={toValue(defaultValue)}
      allowClear={{
        clearIcon: <CloseCircleFilled role="button" aria-label="icon-close-select" />,
      }}
      labelInValue
      notFoundContent={loading ? <Spin /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      options={options}
      fieldNames={fieldNames}
      showSearch
      popupMatchSelectWidth={false}
      filterOption={(input, option) => (option?.[fieldNames.label || 'label'] ?? '').includes(input)}
      filterSort={(optionA, optionB) =>
        (optionA?.[fieldNames.label || 'label'] ?? '')
          .toLowerCase()
          .localeCompare((optionB?.[fieldNames.label || 'label'] ?? '').toLowerCase())
      }
      onChange={(changed) => {
        const current = getCurrentOptions(
          toArr(changed).map((v) => v.value),
          rawOptions || options,
          fieldNames,
        );
        if (['tags', 'multiple'].includes(mode as string) || props.multiple) {
          onChange?.(current);
        } else {
          onChange?.(current.shift() || null);
        }
      }}
      mode={mode}
      tagRender={(props) => {
        return (
          // @ts-ignore
          <Tag
            role="button"
            aria-label={props.label}
            closeIcon={<CloseOutlined role="button" aria-label="icon-close-tag" />}
            {...props}
          >
            {props.label}
          </Tag>
        );
      }}
      {...others}
    />
  );
};

const filterOption = (input, option) => (option?.label ?? '').toLowerCase().includes((input || '').toLowerCase());

const replacePlaceholders = (inputStr, values) => {
  return inputStr.replace(/{{(.*?)}}/g, function (match, placeholder) {
    return Object.prototype.hasOwnProperty.call(values, placeholder) ? values[placeholder] : match;
  });
};

const InternalSelect = connect(
  (props: Props) => {
    const { objectValue, loading, value, rawOptions, defaultValue, ...others } = props;
    let mode: any = props.multiple ? 'multiple' : props.mode;
    if (mode && !['multiple', 'tags'].includes(mode)) {
      mode = undefined;
    }
    const _label = others.fieldNames.label;

    const _options = others?.options?.map((op) => {
      const valueOject = {};
      let outputStr = '';

      if (_label.includes('{{')) {
        const regex = /{{(.*?)}}/g;

        let match;
        while ((match = regex.exec(_label))) {
          valueOject[match[1]] = op[match[1]] || '';
        }
        outputStr = replacePlaceholders(_label, valueOject);
      } else {
        outputStr = op[_label];
      }
      op[_label ? _label : op.label] = outputStr;
      return op;
    });
    if (objectValue) {
      return (
        <ObjectSelect
          rawOptions={rawOptions}
          {...others}
          defaultValue={defaultValue}
          value={value}
          mode={mode}
          loading={loading}
        />
      );
    }
    const toValue = (v) => {
      if (['tags', 'multiple'].includes(props.mode) || props.multiple) {
        if (v) {
          return toArr(v);
        }
        return undefined;
      }
      return v;
    };
    return (
      <AntdSelect
        // @ts-ignore
        role="button"
        data-testid={`select-${mode || 'single'}`}
        showSearch
        filterOption={filterOption}
        allowClear={{
          clearIcon: <CloseCircleFilled role="button" aria-label="icon-close-select" />,
        }}
        popupMatchSelectWidth={false}
        notFoundContent={loading ? <Spin /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        value={toValue(value)}
        defaultValue={toValue(defaultValue)}
        tagRender={(props) => {
          return (
            // @ts-ignore
            <Tag
              role="button"
              aria-label={props.label}
              closeIcon={<CloseOutlined role="button" aria-label="icon-close-tag" />}
              {...props}
            >
              {props.label}
            </Tag>
          );
        }}
        {...others}
        onChange={(changed) => {
          props.onChange?.(changed === undefined ? null : changed);
        }}
        options={_options}
        mode={mode}
      />
    );
  },
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      return {
        ...props,
        fieldNames: { ...defaultFieldNames, ...props.fieldNames },
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty),
);

export const Select = InternalSelect as unknown as typeof InternalSelect & {
  ReadPretty: typeof ReadPretty;
};

Select.ReadPretty = ReadPretty;

export default Select;
