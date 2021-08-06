import React, { useEffect } from 'react';
import {
  connect,
  mapProps,
  mapReadPretty,
  observer,
  RecursionField,
  ISchema,
  Schema,
  ArrayField,
  useField,
  FormProvider,
} from '@formily/react';
import { LoadingOutlined } from '@ant-design/icons';
import { useDynamicList, useMap } from 'ahooks';
import { Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { FilterItem } from './FilterItem';
import cls from 'classnames';
import './style.less';
import { cloneDeep } from 'lodash';
import { uid, isValid } from '@formily/shared';
import { SchemaField, SchemaRenderer } from '../../components/schema-renderer';
import { useMemo } from 'react';
import { createForm, onFormValuesChange } from '@formily/core';
import deepmerge from 'deepmerge';

const toValue = (value) => {
  if (!value) {
    return {
      logical: 'and',
      list: [{}],
    };
  }
  if (value.and) {
    return {
      logical: 'and',
      list: value.and,
    };
  }
  if (value.or) {
    return {
      logical: 'and',
      list: value.or,
    };
  }
  return {
    logical: 'and',
    list: [{}],
  };
};

export function FilterGroup(props) {
  const { bordered = true, onRemove, onChange } = props;
  const value = toValue(props.value);
  console.log('list', value);
  return (
    <div className={cls('nb-filter-group', { bordered })}>
      {onRemove && (
        <a className={'nb-filter-group-close'} onClick={() => onRemove()}>
          <CloseCircleOutlined />
        </a>
      )}
      <div style={{ marginBottom: 14 }}>
        满足组内{' '}
        <Select
          style={{ width: 80 }}
          onChange={(logical) => {
            onChange &&
              onChange({
                [logical]: value.list,
              });
          }}
          defaultValue={value.logical}
        >
          <Select.Option value={'and'}>全部</Select.Option>
          <Select.Option value={'or'}>任意</Select.Option>
        </Select>{' '}
        条件
      </div>
      <FilterList
        initialValue={value.list}
        onChange={(list: any[]) => {
          console.log('list9999', list);
          onChange &&
            onChange({
              [value.logical]: list.filter(
                (item) => isValid(item) && Object.keys(item).length,
              ),
            });
        }}
      />
    </div>
  );
}

export function FilterList(props) {
  const { initialValue = [] } = props;

  const [map, { set, setAll, remove, reset, get }] = useMap<string, any>(
    initialValue.map((item, index) => {
      return [`index-${index}`, item];
    }),
  );

  useEffect(() => {
    props.onChange && props.onChange([...map.values()]);
  }, [map]);

  return (
    <div className={'nb-filter-list'}>
      <div>
        {[...map.entries()].map(([index, item]) => {
          if (item.and || item.or) {
            return (
              <FilterGroup
                key={index}
                value={item}
                onChange={(value: any) => set(index, value)}
                onRemove={() => remove(index)}
              />
            );
          }
          return (
            <FilterItem
              key={index}
              value={item}
              onChange={(value: any) => set(index, value)}
              onRemove={() => remove(index)}
            />
          );
        })}
      </div>
      <a
        onClick={() => {
          set(uid(), {});
        }}
      >
        添加条件
      </a>{' '}
      <a
        onClick={() => {
          set(uid(), {
            and: [{}],
          });
        }}
      >
        添加条件组
      </a>
    </div>
  );
}

export const Filter: any = connect(
  (props) => {
    // console.log('Filter.props', { props });
    return (
      <div>
        <FilterGroup bordered={false} {...props} />
      </div>
    );
  },
  mapProps((props, field) => {
    return {
      ...props,
      suffix: (
        <span>
          {field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffix
          )}
        </span>
      ),
    };
  }),
  mapReadPretty((props) => {
    return null;
  }),
);

interface DynamicValuePorps {
  value?: any;
  onChange?: any;
  schema?: Schema;
  operation?: any;
}

Filter.DynamicValue = connect((props: DynamicValuePorps) => {
  const { onChange, value, operation } = props;
  const fieldName = Object.keys(props?.schema?.properties || {}).shift();
  const fieldSchema = Object.values(props?.schema?.properties || {}).shift();
  console.log('Filter.DynamicValue', fieldSchema, { operation });
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          [fieldName || 'value']: value,
        },
        // effects() {
        //   onFormValuesChange((form) => {
        //     onChange(form.values[fieldName]);
        //   });
        // },
      }),
    [value],
  );
  const extra: ISchema = deepmerge(
    {
      required: false,
      'x-read-pretty': false,
      'x-decorator': 'FormilyFormItem',
      'x-decorator-props': {
        asterisk: true,
        feedbackLayout: 'none',
      },
      'x-component-props': {
        onChange,
        style: {
          minWidth: '150px',
        },
      },
    },
    operation?.schema || {},
  );
  return (
    <FormProvider form={form}>
      <SchemaField
        schema={{
          type: 'object',
          properties: {
            [fieldName]: deepmerge(fieldSchema, extra, {
              arrayMerge: (target, source) => source,
            }),
          },
        }}
      />
    </FormProvider>
  );
});

export default Filter;
