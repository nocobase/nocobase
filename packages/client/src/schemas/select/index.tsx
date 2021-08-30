import React, { useEffect } from 'react';
import {
  connect,
  mapReadPretty,
  mapProps,
  useField,
  observer,
  RecursionField,
  useFieldSchema,
  Schema,
} from '@formily/react';
import { Drawer, Select as AntdSelect, Tag } from 'antd';
import { PreviewText } from '@formily/antd';
import { LoadingOutlined } from '@ant-design/icons';
import { SelectProps } from 'antd/lib/select';
import { isArr, isValid, toArr } from '@formily/shared';
import { useState } from 'react';
import { useDesignable } from '../';
import { createContext } from 'react';
import { useContext } from 'react';
import { get, isEmpty } from 'lodash';
import { Field, isArrayField, isField } from '@formily/core';
import { Action } from '../action';
import { BlockSchemaContext, VisibleContext } from '../../context';
import { SchemaRenderer } from '../../components/schema-renderer';
import { uid } from '@formily/shared';
import { CollectionFieldContext } from '../table';
import { CollectionProvider, useCollectionContext } from '../../constate';
import { Resource } from '../../resource';
import { useRequest } from 'ahooks';
import constate from 'constate';

export const Select: any = connect(
  (props) => {
    const { options = [], ...others } = props;
    return (
      <AntdSelect {...others}>
        {options.map((option: any, key: any) => {
          if (option.children) {
            return (
              <AntdSelect.OptGroup key={key} label={option.label}>
                {option.children.map((child: any, childKey: any) => (
                  <AntdSelect.Option key={`${key}-${childKey}`} {...child}>
                    {child.label}
                  </AntdSelect.Option>
                ))}
              </AntdSelect.OptGroup>
            );
          } else {
            return (
              <AntdSelect.Option key={key} {...option}>
                {option.label}
              </AntdSelect.Option>
            );
          }
        })}
      </AntdSelect>
    );
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        suffixIcon:
          field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffixIcon
          ),
      };
    },
  ),
  mapReadPretty((props) => {
    // console.log('mapReadPretty', props.value)
    // return <div></div>;
    if (!isValid(props.value)) {
      return <div></div>;
    }
    const field = useField<any>();
    if (isArrayField(field) && field?.value?.length === 0) {
      return <div></div>;
    }
    const dataSource = field.dataSource || [];
    console.log('field.value', field.value, dataSource);
    const values = toArr(field.value);
    const findOptions = (options: any[]) => {
      let current = [];
      for (const option of options) {
        if (values.includes(option.value)) {
          current.push(option);
        }
        if (option.children) {
          const children = findOptions(option.children);
          current.push(...children);
        }
      }
      return current;
    };
    const options = findOptions(dataSource);
    return (
      <div>
        {options.map((option, key) => (
          <Tag key={key} color={option.color}>
            {option.label}
          </Tag>
        ))}
      </div>
    );
  }),
);

Select.Object = connect(
  (props) => {
    const field = useField();
    const {
      value,
      onChange,
      fieldNames = {
        label: 'label',
        value: 'value',
      },
      ...others
    } = props;
    const options = field?.['dataSource'] || props.options || [];
    let optionValue = undefined;
    if (isArr(value)) {
      optionValue = value.map((val) => {
        return {
          label: val[fieldNames.label],
          value: val[fieldNames.value],
        };
      });
    } else if (value) {
      optionValue = {
        label: value[fieldNames.label],
        value: value[fieldNames.value],
      };
    }
    return (
      <AntdSelect
        allowClear
        labelInValue
        {...others}
        value={optionValue}
        onChange={(selectValue: any) => {
          if (!isValid(selectValue)) {
            onChange(null);
            return;
          }
          if (isArr(selectValue)) {
            const selectValues = selectValue.map((s) => s.value);
            const values = {};
            if (isArr(value)) {
              value.forEach((option) => {
                const val = option[fieldNames.value];
                if (selectValues.includes(val)) {
                  values[val] = option;
                }
              });
            }
            options.forEach((option) => {
              const val = option[fieldNames.value];
              if (selectValues.includes(val)) {
                values[val] = option;
              }
            });
            console.log({ selectValue, values });
            onChange(Object.values(values));
          } else {
            // 这里不能用 undefined，需要用 null
            onChange(
              options.find(
                (option) => option[fieldNames.value] === selectValue.value,
              ),
            );
          }
        }}
        options={options.map((option) => {
          return {
            label: option[fieldNames.label],
            value: option[fieldNames.value],
          };
        })}
      />
    );
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        options: field?.['dataSource'],
        suffixIcon:
          field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffixIcon
          ),
      };
    },
  ),
  mapReadPretty(
    observer((props: any) => {
      const {
        value,
        fieldNames = { label: 'label', color: 'color' },
        ...others
      } = props;
      if (!value) {
        return null;
      }
      if (isEmpty(value)) {
        return null;
      }
      const values = toArr(value);
      return (
        <div>
          {values.map((val) =>
            fieldNames.color ? (
              <Tag color={val[fieldNames.color]}>{val[fieldNames.label]}</Tag>
            ) : (
              <Tag>{val[fieldNames.label]}</Tag>
            ),
          )}
        </div>
      );
    }),
  ),
);

const OptionTagContext = createContext(null);

const SelectedRowsContext = createContext<any>(null);

Select.useOkAction = () => {
  const { props } = useContext(SelectContext);
  const { selectedRows } = useContext(SelectedRowsContext);
  return {
    async run() {
      props.onChange(selectedRows);
      console.log('selectedRows', selectedRows);
    },
  };
};

Select.useRowSelection = () => {
  const { props } = useContext(SelectContext);
  return {
    type: props.multiple ? 'checkbox' : 'radio',
  };
};

Select.useSelect = () => {
  const { setSelectedRows } = useContext(SelectedRowsContext);
  return (keys, rows) => {
    setSelectedRows(rows);
    console.log('Select.onSelect', keys, rows);
  };
};

export const useSelectedRowKeys = () => {
  const { selectedRows } = useContext(SelectedRowsContext);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>(selectedRows.map((row) => row.id));
  useEffect(() => {
    setSelectedRowKeys(selectedRows.map((row) => row.id));
  }, [selectedRows]);
  console.log('useSelectedRowKeys', selectedRows)
  return { selectedRowKeys, setSelectedRowKeys };
};

Select.useSelectedRowKeys = useSelectedRowKeys;

const SelectContext = createContext(null);

Select.Drawer = connect(
  (props) => {
    const field = useField<Field>();
    const {
      onChange,
      // fieldNames = {
      //   label: 'id',
      //   value: 'id',
      // },
      ...others
    } = props;
    let value = props.value;
    const [visible, setVisible] = useState(false);
    const { schema } = useDesignable();
    const fieldNames = {
      label: 'id',
      value: 'id',
      ...(get(schema['x-component-props'], 'fieldNames') || {}),
    };
    const options = field?.['dataSource'] || props.options || [];
    if (props.multiple) {
      Object.assign(others, {
        mode: 'multiple',
      });
    }
    let optionValue = undefined;
    if (props.multiple) {
      value = toArr(value);
    }
    if (isArr(value)) {
      optionValue = value.map((val) => {
        return {
          label: val[fieldNames.label],
          value: val[fieldNames.value],
        };
      });
    } else if (value) {
      optionValue = {
        label: value[fieldNames.label],
        value: value[fieldNames.value],
      };
    }
    const [selectedRows, setSelectedRows] = useState(toArr(field.value));
    console.log('useSelectedRowKeys.toArr', toArr(field.value))
    useEffect(() => {
      setSelectedRows(toArr(field.value));
    }, [field.value]);
    const onFieldChange = (selectValue) => {
      if (!isValid(selectValue)) {
        onChange(null);
        return;
      }
      if (isArr(selectValue)) {
        const values = {};
        if (isArr(value)) {
          value.forEach((option) => {
            const val = option[fieldNames.value];
            if (selectValue.includes(val)) {
              values[val] = option;
            }
          });
        }
        options.forEach((option) => {
          const val = option[fieldNames.value];
          if (selectValue.includes(val)) {
            values[val] = option;
          }
        });
        onChange(Object.values(values));
      } else {
        // 这里不能用 undefined，需要用 null
        onChange(
          options.find((option) => option[fieldNames.value] === selectValue),
        );
      }
      // setSelectedRows(toArr(field.value));
    };
    // const selectedKeys = toArr(optionValue).map((item) => item.value);
    console.log({ optionValue, value });
    const collectionField = useContext(CollectionFieldContext);
    return (
      <SelectContext.Provider value={{ field, schema, props }}>
        <VisibleContext.Provider value={[visible, setVisible]}>
          <AntdSelect
            {...others}
            labelInValue
            open={false}
            value={optionValue}
            onClick={() => {
              setVisible(true);
            }}
            onChange={(selectValue: any) => {
              if (!selectValue) {
                onChange(null);
                return;
              }
              if (isArr(selectValue)) {
                const selectValues = selectValue.map((s) => s.value);
                onFieldChange(selectValues);
              } else {
                onFieldChange(selectValue.value);
              }
            }}
          ></AntdSelect>
          <SelectedRowsContext.Provider
            value={{ selectedRows, setSelectedRows }}
          >
            <CollectionProvider collectionName={collectionField?.target}>
              <RecursionField
                onlyRenderProperties
                schema={schema}
                filterProperties={(s) => {
                  return s['x-component'] === 'Select.Options.Drawer';
                }}
              />
            </CollectionProvider>
          </SelectedRowsContext.Provider>
        </VisibleContext.Provider>
      </SelectContext.Provider>
    );
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        options: field?.['dataSource'],
        suffixIcon:
          field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffixIcon
          ),
      };
    },
  ),
  mapReadPretty(
    observer((props: any) => {
      const collectionField = useContext(CollectionFieldContext);
      const field = useField<Formily.Core.Models.Field>();
      const { ...others } = props;
      const value = field.value || field.initialValue;
      const { schema } = useDesignable();
      const fieldNames = {
        label: 'id',
        value: 'id',
        ...(get(schema['x-component-props'], 'fieldNames') || {}),
      };
      console.log({ fieldNames, field, value });
      if (!value) {
        return null;
      }
      const values = toArr(value);
      const s = schema.reduceProperties((buf, current) => {
        if (current['x-component'] === 'Select.OptionTag') {
          return current;
        }
        return buf;
      }, null);
      return (
        <div>
          <BlockSchemaContext.Provider value={schema}>
            <CollectionProvider collectionName={collectionField?.target}>
              {values.map((data, index) => {
                return (
                  <OptionTagContext.Provider
                    value={{ index, data, fieldNames }}
                  >
                    {s ? (
                      <RecursionField name={s.name} schema={s} />
                    ) : (
                      data[fieldNames.label]
                    )}
                  </OptionTagContext.Provider>
                );
              })}
            </CollectionProvider>
          </BlockSchemaContext.Provider>
        </div>
      );
    }),
  ),
);

Select.Drawer.useResource = ({ onSuccess }) => {
  const { collection } = useCollectionContext();
  const ctx = useContext(OptionTagContext);
  const resource = Resource.make({
    resourceName: collection?.name,
    resourceKey: ctx.data.id,
  });
  console.log('OptionTagContext', ctx.data.id);
  const { schema } = useDesignable();
  const fieldFields = (schema: Schema) => {
    const names = [];
    schema.reduceProperties((buf, current) => {
      if (current['x-component'] === 'Form.Field') {
        const fieldName = current['x-component-props']?.['fieldName'];
        if (fieldName) {
          buf.push(fieldName);
        }
      } else {
        const fieldNames = fieldFields(current);
        buf.push(...fieldNames);
      }
      return buf;
    }, names);
    return names;
  };
  const [visible] = useContext(VisibleContext);
  const service = useRequest(
    (params?: any) => {
      console.log('Table.useResource', params);
      return resource.get({ ...params, appends: fieldFields(schema) });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess,
      manual: true,
    },
  );
  useEffect(() => {
    if (visible) {
      service.run();
    }
  }, [visible]);
  return { resource, service, initialValues: service.data, ...service };
};

Select.Options = observer((props) => {
  return <>{props.children}</>;
});

Select.Options.Drawer = Action.Drawer;

export function useSelect() {
  const { onChange } = useContext(SelectContext);
  return {
    async run() {
      onChange && onChange([]);
    },
  };
}

export function useOptionTagValues() {
  const { data } = useContext(OptionTagContext);
  return data;
}

Select.OptionTag = observer((props) => {
  const [visible, setVisible] = useState(false);
  const { data, fieldNames } = useContext(OptionTagContext);
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <Tag onClick={() => setVisible(true)}>{data[fieldNames.label]}</Tag>
      {props.children}
    </VisibleContext.Provider>
  );
});

export default Select;
