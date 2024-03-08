import { ArrayItems, FormItem } from '@formily/antd-v5';
import { createForm, onFormValuesChange } from '@formily/core';
import { FormProvider, connect, createSchemaField, observer, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Select as AntdSelect, Input, Space, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useCollectionManager_deprecated } from '../../../';
import { mergeFilter } from '../../../filter-provider/utils';
import { SchemaComponent, useCompile } from '../../../schema-component';
import useServiceOptions, { useAssociationFieldContext } from './hooks';

const EMPTY = 'N/A';
const SchemaField = createSchemaField({
  components: {
    Space,
    Input,
    ArrayItems,
    FormItem,
  },
});

const CascadeSelect = connect((props) => {
  const { data, mapOptions, onChange, value } = props;
  const [selectedOptions, setSelectedOptions] = useState<{ key: string; children: any; value?: any }[]>([
    { key: undefined, children: [], value: null },
  ]);
  const [options, setOptions] = useState(data);
  const [loading, setLoading] = useState(false);
  const compile = useCompile();
  const api = useAPIClient();
  const service = useServiceOptions(props);
  const { options: collectionField, field: associationField } = useAssociationFieldContext<any>();
  const resource = api.resource(collectionField.target);
  const { getCollectionJoinField, getInterface } = useCollectionManager_deprecated();
  const fieldNames = associationField?.componentProps?.fieldNames;
  const targetField =
    collectionField?.target &&
    fieldNames?.label &&
    getCollectionJoinField(`${collectionField.target}.${fieldNames.label}`);
  const operator = useMemo(() => {
    if (targetField?.interface) {
      return getInterface(targetField.interface)?.filterable?.operators[0].value || '$includes';
    }
    return '$includes';
  }, [targetField]);
  const field: any = useField();
  useEffect(() => {
    if (value) {
      const values = Array.isArray(value)
        ? extractLastNonNullValueObjects(value?.filter((v) => v.value), true)
        : transformNestedData(value);
      const options = values?.map?.((v) => {
        return {
          key: v.parentId,
          children: [],
          value: v,
        };
      });
      setSelectedOptions(options);
    }
  }, []);
  const mapOptionsToTags = useCallback(
    (options) => {
      try {
        return options
          ?.filter((v) => ['number', 'string'].includes(typeof v[fieldNames.value]))
          .map((option) => {
            let label = compile(option[fieldNames.label]);

            if (targetField?.uiSchema?.enum) {
              if (Array.isArray(label)) {
                label = label
                  .map((item, index) => {
                    const option = (targetField.uiSchema.enum as any).find?.((i) => i.value === item);
                    if (option) {
                      return (
                        <Tag key={index} color={option.color} style={{ marginRight: 3 }}>
                          {option?.label || item}
                        </Tag>
                      );
                    } else {
                      return <Tag key={item}>{item}</Tag>;
                    }
                  })
                  .reverse();
              } else {
                const item = (targetField.uiSchema.enum as any).find?.((i) => i.value === label);
                if (item) {
                  label = <Tag color={item.color}>{item.label}</Tag>;
                }
              }
            }
            if (targetField?.type === 'date') {
              label = dayjs(label).format('YYYY-MM-DD');
            }

            if (mapOptions) {
              return mapOptions({
                [fieldNames.label]: label || EMPTY,
                [fieldNames.value]: option[fieldNames.value],
              });
            }
            return {
              ...option,
              [fieldNames.label]: label || EMPTY,
              [fieldNames.value]: option[fieldNames.value],
            };
          })
          .filter(Boolean);
      } catch (err) {
        console.error(err);
        return options;
      }
    },
    [targetField?.uiSchema, fieldNames],
  );
  const handleGetOptions = async (filter) => {
    const response = await resource.list({
      pageSize: 200,
      params: service?.params,
      filter: mergeFilter([service?.params?.filter, filter]),
      tree: !filter.parentId ? true : undefined,
    });
    return response?.data?.data;
  };

  const handleSelect = async (value, option, index) => {
    const data = await handleGetOptions({ parentId: option?.id });
    const options = [...selectedOptions];
    options.splice(index + 1);
    options[index] = { ...options[index], value: option };
    if (option?.id) {
      options[index + 1] = { key: option?.id, children: data?.length > 0 ? data : null };
    }
    setSelectedOptions(options);
    if (['o2m', 'm2m'].includes(collectionField.interface)) {
      const fieldValue = Array.isArray(associationField.fieldValue) ? associationField.fieldValue : [];
      fieldValue[field.index] = option;
      associationField.fieldValue = fieldValue;
    } else {
      associationField.value = option;
    }
    onChange?.(options);
  };

  const onDropdownVisibleChange = async (visible, selectedValue, index) => {
    if (visible) {
      setLoading(true);
      const result = await handleGetOptions({ parentId: selectedValue?.key });
      setLoading(false);
      setOptions(result);
      if (index === selectedOptions?.length - 1 && selectedValue?.value?.id) {
        const data = await handleGetOptions({ parentId: selectedValue?.value?.id });
        const options = [...selectedOptions];
        options.splice(index + 1);
        options[index] = { ...options[index], value: selectedValue?.value };
        options[index + 1] = { key: selectedValue?.value?.id, children: data?.length > 0 ? data : null };
        setSelectedOptions(options);
        onChange?.(options);
      }
    }
  };

  const onSearch = async (search, selectedValue) => {
    const serachParam = search
      ? {
          [fieldNames.label]: {
            [operator]: search,
          },
        }
      : {};
    setLoading(true);
    const result = await handleGetOptions({
      ...serachParam,
      parentId: selectedValue?.key,
    });
    setLoading(false);
    setOptions(result);
  };
  return (
    <Space wrap>
      {selectedOptions.map((value, index) => {
        return (
          value.children && (
            <AntdSelect
              disabled={associationField.disabled}
              key={`${value.value?.id}+ ${value.key} + ${fieldNames.label}`}
              allowClear
              showSearch
              autoClearSearchValue
              filterOption={false}
              filterSort={null}
              defaultValue={{
                label: value?.value?.[fieldNames.label],
                value: value?.value?.[fieldNames.value],
              }}
              labelInValue
              onSearch={(search) => onSearch(search, value)}
              fieldNames={fieldNames}
              style={{ minWidth: 150 }}
              onChange={((value, option) => handleSelect(value, option, index)) as any}
              options={!loading ? mapOptionsToTags(options) : []}
              onDropdownVisibleChange={(open) => onDropdownVisibleChange(open, value, index)}
              notFoundContent={loading ? <Spin size="small" /> : null}
            />
          )
        );
      })}
    </Space>
  );
});
const AssociationCascadeSelect = connect((props: any) => {
  return (
    <div>
      <CascadeSelect {...props} />
    </div>
  );
});

export const InternalCascadeSelect = observer(
  (props: any) => {
    const { options: collectionField } = useAssociationFieldContext();
    const selectForm = useMemo(() => createForm(), []);
    const { t } = useTranslation();
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    useEffect(() => {
      const id = uid();
      selectForm.addEffects(id, () => {
        onFormValuesChange((form) => {
          if (collectionField.interface === 'm2o') {
            const value = extractLastNonNullValueObjects(form.values?.[fieldSchema.name]);
            setTimeout(() => {
              form.setValuesIn(fieldSchema.name, value);
              props.onChange(value);
              field.value = value;
            });
          } else {
            const value = extractLastNonNullValueObjects(form.values?.select_array).filter(
              (v) => v && Object.keys(v).length > 0,
            );
            setTimeout(() => {
              field.value = value;
              props.onChange(value);
            });
          }
        });
      });
      return () => {
        selectForm.removeEffects(id);
      };
    }, []);
    const toValue = () => {
      if (Array.isArray(field.value) && field.value.length > 0) {
        return field.value;
      }
      return [{}];
    };
    const defaultValue = toValue();
    const schema = {
      type: 'object',
      properties: {
        select_array: {
          type: 'array',
          'x-component': 'ArrayItems',
          'x-decorator': 'FormItem',
          default: defaultValue,
          items: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              sort: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.SortHandle',
              },
              select: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': AssociationCascadeSelect,
                'x-component-props': {
                  ...props,
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
          properties: {
            add: {
              type: 'void',
              title: t('Add new'),
              'x-component': 'ArrayItems.Addition',
            },
          },
        },
      },
    };
    return (
      props.value !== null && (
        <FormProvider form={selectForm}>
          {collectionField.interface === 'm2o' ? (
            <SchemaComponent
              components={{ FormItem }}
              schema={{
                ...fieldSchema,
                default: field.value,
                title: '',
                'x-component': AssociationCascadeSelect,
                'x-component-props': {
                  ...props,
                },
              }}
            />
          ) : (
            <SchemaField schema={schema} />
          )}
        </FormProvider>
      )
    );
  },
  { displayName: 'InternalCascadeSelect' },
);

function extractLastNonNullValueObjects(data, flag?) {
  let result = [];
  if (!Array.isArray(data)) {
    return data;
  }
  for (const sublist of data) {
    let lastNonNullValue = null;
    if (Array.isArray(sublist)) {
      for (let i = sublist?.length - 1; i >= 0; i--) {
        if (sublist[i].value) {
          lastNonNullValue = sublist[i].value;
          break;
        }
      }
      if (lastNonNullValue) {
        result.push(lastNonNullValue);
      }
    } else {
      if (sublist?.value) {
        lastNonNullValue = sublist.value;
      } else {
        lastNonNullValue = null;
      }
      if (lastNonNullValue) {
        if (flag) {
          result?.push?.(lastNonNullValue);
        } else {
          result = lastNonNullValue;
        }
      } else {
        result?.push?.(sublist);
      }
    }
  }
  return result;
}

export function transformNestedData(inputData) {
  const resultArray = [];

  function recursiveTransform(data) {
    if (data?.parent) {
      const { parent } = data;
      recursiveTransform(parent);
    }
    const { parent, ...other } = data;
    resultArray.push(other);
  }
  if (inputData) {
    recursiveTransform(inputData);
  }
  return resultArray;
}
