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
  useForm,
} from '@formily/react';
import { LoadingOutlined } from '@ant-design/icons';
import { useDynamicList, useMap, useMount, useUnmount } from 'ahooks';
import { Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { FilterItem } from './FilterItem';
import cls from 'classnames';
import './style.less';
import { cloneDeep } from 'lodash';
import { uid, isValid } from '@formily/shared';
import { SchemaField, SchemaRenderer } from '../../components/schema-renderer';
import { useMemo } from 'react';
import { createForm, LifeCycleTypes, onFormReset } from '@formily/core';
import deepmerge from 'deepmerge';
import { Trans, useTranslation } from 'react-i18next';

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
  const form = useForm();
  console.log('list', value);

  return (
    <div className={cls('nb-filter-group', { bordered })}>
      {onRemove && (
        <a className={'nb-filter-group-close'} onClick={() => onRemove()}>
          <CloseCircleOutlined />
        </a>
      )}
      <div style={{ marginBottom: 14 }}>
        <Trans>
          {'Meet '}
          <Select
            style={{ width: 80 }}
            onChange={(logical) => {
              onChange?.({
                [logical]: value.list,
              });
            }}
            defaultValue={value.logical}
          >
            <Select.Option value={'and'}>All</Select.Option>
            <Select.Option value={'or'}>Any</Select.Option>
          </Select>
          {' conditions in the group'}
        </Trans>
      </div>
      <FilterList
        initialValue={value.list}
        onChange={(list: any[]) => {
          console.log('list9999', list);
          onChange &&
            onChange({
              [value.logical]: list.filter((item) => isValid(item) && Object.keys(item).length),
            });
        }}
      />
    </div>
  );
}

export function FilterList(props) {
  const { initialValue = [] } = props;
  const form = useForm();
  const { t } = useTranslation();

  const [map, { set, setAll, remove, reset }] = useMap<string, any>(
    initialValue.map((item, index) => {
      return [`index-${index}`, item];
    }),
  );
  useEffect(() => {
    const id = uid();
    form.addEffects(id, () => {
      onFormReset((form) => {
        setAll([]);
        setTimeout(() => {
          reset();
        }, 0);
      });
      return () => {
        form.removeEffects(id);
      };
    });
  }, []);
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
      <div style={{ marginTop: 16 }}>
        <a
          onClick={() => {
            set(uid(), {});
          }}
        >
          {t('Add filter')}
        </a>
        <a
          style={{ marginLeft: 16 }}
          onClick={() => {
            set(uid(), {
              and: [{}],
            });
          }}
        >
          {t('Add filter group')}
        </a>
      </div>
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
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
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
            }) as any,
          },
        }}
      />
    </FormProvider>
  );
});

export default Filter;
