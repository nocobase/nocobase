import { CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { createForm, onFormReset } from '@formily/core';
import { connect, FormProvider, ISchema, mapProps, mapReadPretty, Schema, useForm } from '@formily/react';
import { isValid, uid } from '@formily/shared';
import { useMap } from 'ahooks';
import { Select } from 'antd';
import cls from 'classnames';
import deepmerge from 'deepmerge';
import React, { useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SchemaComponent } from '../../components';
import { FilterItem } from './FilterItem';
import './style.less';

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
        </Trans>
      </div>
      <FilterList
        initialValue={value.list}
        onChange={(list: any[]) => {
          onChange?.({
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
  debugger;
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
    props.onChange?.([...map.values()]);
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
    debugger;
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
  debugger;
  return (
    <FormProvider form={form}>
      <SchemaComponent
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
