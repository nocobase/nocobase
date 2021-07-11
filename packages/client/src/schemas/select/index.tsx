import React from 'react';
import {
  connect,
  mapReadPretty,
  mapProps,
  useField,
  observer,
  RecursionField,
  useFieldSchema,
} from '@formily/react';
import { Drawer, Select as AntdSelect, Tag } from 'antd';
import { PreviewText } from '@formily/antd';
import { LoadingOutlined } from '@ant-design/icons';
import { SelectProps } from 'antd/lib/select';
import { isArr, isValid, toArr } from '@formily/shared';
import { useState } from 'react';
import { useDesignable } from '../DesignableSchemaField';
import { createContext } from 'react';
import { useContext } from 'react';
import { SelectedRowKeysContext, useTableContext } from '../table';

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
    const field = useField<any>();
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
      const { value, fieldNames = { label: 'label' }, ...others } = props;
      if (!value) {
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

const SelectContext = createContext<any>({});

Select.Drawer = connect(
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
    const [visible, setVisible] = useState(false);
    const schema = useFieldSchema();
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
    };

    const selectedKeys = toArr(optionValue).map(item => item.value);

    console.log({ selectedKeys })

    return (
      <>
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
        <Drawer
          width={'50%'}
          visible={visible}
          onClose={() => setVisible(false)}
          destroyOnClose
        >
          <SelectedRowKeysContext.Provider value={selectedKeys}>
            <SelectContext.Provider
              value={{
                onChange(selectValue) {
                  onFieldChange(selectValue);
                  setVisible(false);
                },
              }}
            >
              <RecursionField
                onlyRenderProperties
                schema={schema}
                filterProperties={(s) => {
                  return s['x-component'] === 'Select.Options';
                }}
              />
            </SelectContext.Provider>
          </SelectedRowKeysContext.Provider>
        </Drawer>
      </>
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
      const field = useField<Formily.Core.Models.Field>();
      const { fieldNames = { label: 'label' }, ...others } = props;
      const value = field.value || field.initialValue;
      const schema = useFieldSchema();
      console.log({ field, value });
      if (!value) {
        return null;
      }
      const values = toArr(value);
      return (
        <div>
          {values.map((data, index) => {
            return (
              <OptionTagContext.Provider value={{ index, data, fieldNames }}>
                <RecursionField
                  schema={schema}
                  onlyRenderProperties
                  filterProperties={(s) => {
                    return s['x-component'] === 'Select.OptionTag';
                  }}
                />
              </OptionTagContext.Provider>
            );
          })}
        </div>
      );
    }),
  ),
);

Select.Options = observer((props) => {
  return <>{props.children}</>;
});

export function useSelect() {
  const { onChange } = useContext(SelectContext);
  const { data, selectedRowKeys } = useTableContext();
  return {
    async run() {
      console.log({ data, selectedRowKeys });
      onChange && onChange(selectedRowKeys);
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
    <>
      <Tag onClick={() => setVisible(true)}>{data[fieldNames.label]}</Tag>
      <Drawer width={'50%'} visible={visible} onClose={() => setVisible(false)}>
        {props.children}
      </Drawer>
    </>
  );
});

export default Select;
