import { observer, useField, useFieldSchema } from '@formily/react';
import { Space, Select, Tag, Spin } from 'antd';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { useCompile } from '../../../schema-component';
import { useAPIClient, useCollectionManager } from '../../../';
import { isVariable } from '../../common/utils/uitls';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import useServiceOptions, { useAssociationFieldContext } from './hooks';

const EMPTY = 'N/A';

function updateArrayWithKey(a, b) {
  const index = a.findIndex((item) => item.key === b.key);
  if (index !== -1) {
    a[index] = b;
  } else {
    a.push(b);
  }

  return a;
}

export const InternalCascadeSelect = observer(
  (props: any) => {
    const { fieldNames } = props;
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    const service = useServiceOptions(props);
    const initValue = isVariable(props.value) ? undefined : props.value;
    const value = Array.isArray(initValue) ? initValue.filter(Boolean) : initValue;
    const api = useAPIClient();
    const { options: collectionField } = useAssociationFieldContext();
    const resource = api.resource(collectionField.target);
    const [selectedOptions, setSelectedOptions] = useState<{ key: string; children: [] }[]>([
      { key: null, children: [] },
    ]);

    useEffect(() => {
      if (props.value) {
        const options = value?.map((v) => {
          return {
            key: v.parentId,
            children: v.children,
            value: { label: v[fieldNames.label], value: v[fieldNames.value] },
          };
        });
        setSelectedOptions(options);
      }
    }, []);

    const handleGetOptions = async (filter) => {
      const response = await resource.list({
        pageSize: 200,
        params: service?.params,
        filter: mergeFilter([service?.params?.filter, filter]),
      });
      return response?.data?.data;
    };

    const handleSelect = async (value, option) => {
      const data = await handleGetOptions({ parentId: option?.id });
      if (data?.length > 0) {
        const options = updateArrayWithKey(selectedOptions, { key: option?.id, children: data });
        setSelectedOptions([...options]);
      }
      const fieldValue = field.value || [];
      fieldValue.push(option);
      field.value = fieldValue;
    };

    return (
      <div key={fieldSchema.name}>
        <Space wrap>
          {selectedOptions.map((selectedValue: any, index) => (
            <CascadeSelect
              key={selectedValue.key}
              fieldNames={fieldNames}
              onChange={handleSelect}
              data={selectedValue.children}
              value={selectedValue.value}
              selectedValue={selectedValue}
              index={index}
              handleGetOptions={handleGetOptions}
            />
          ))}
        </Space>
      </div>
    );
  },
  { displayName: 'InternalCascadeSelect' },
);

const CascadeSelect = (props) => {
  const { fieldNames, data, mapOptions, onChange, key, value, selectedValue, index, handleGetOptions, ...other } =
    props;
  const [options, setOptions] = useState(data);
  const [loading, setLoading] = useState(false);
  const compile = useCompile();
  const { options: collectionField } = useAssociationFieldContext();
  const { getCollectionJoinField, getInterface } = useCollectionManager();
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
                    const option = targetField.uiSchema.enum.find((i) => i.value === item);
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
                const item = targetField.uiSchema.enum.find((i) => i.value === label);
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

  const onDropdownVisibleChange = async (visible) => {
    if (visible && !options.length) {
      setLoading(true);
      const result = await handleGetOptions({ parentId: selectedValue?.key });
      setLoading(false);
      setOptions(result);
    }
  };

  const onSearch = async (search) => {
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
    setTimeout(() => setOptions(result));
  };

  return (
    <Select
      showSearch
      autoClearSearchValue
      filterOption={false}
      filterSort={null}
      value={value}
      labelInValue
      key={index}
      onSearch={onSearch}
      fieldNames={fieldNames}
      style={{ width: 150 }}
      onChange={onChange}
      options={mapOptionsToTags(options)}
      onDropdownVisibleChange={onDropdownVisibleChange}
      notFoundContent={loading ? <Spin size="small" /> : null}
    />
  );
};
