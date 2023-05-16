import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useField, useFieldSchema } from '@formily/react';
import { SelectProps, Tag } from 'antd';
import { uniqBy } from 'lodash';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ResourceActionOptions, useRequest } from '../../../api-client';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { useCompile } from '../../hooks';
import { Select, defaultFieldNames } from '../select';
import { ReadPretty } from './ReadPretty';

export type RemoteSelectProps<P = any> = SelectProps<P, any> & {
  objectValue?: boolean;
  onChange?: (v: any) => void;
  target: string;
  wait?: number;
  manual?: boolean;
  mapOptions?: (data: any) => RemoteSelectProps['fieldNames'];
  targetField?: any;
  service: ResourceActionOptions<P>;
};

const InternalRemoteSelect = connect(
  (props: RemoteSelectProps) => {
    const {
      fieldNames = {},
      service = {},
      wait = 300,
      value,
      objectValue,
      manual = true,
      mapOptions,
      targetField: _targetField,
      ...others
    } = props;
    const compile = useCompile();
    const firstRun = useRef(false);
    const fieldSchema = useFieldSchema();
    const field = useField();
    const { getField } = useCollection();
    const { getCollectionJoinField, getInterface } = useCollectionManager();
    const collectionField = getField(fieldSchema.name);
    const targetField =
      _targetField ||
      (collectionField?.target &&
        fieldNames?.label &&
        getCollectionJoinField(`${collectionField.target}.${fieldNames.label}`));

    const operator = useMemo(() => {
      if (targetField?.interface) {
        return getInterface(targetField.interface)?.filterable?.operators[0].value || '$includes';
      }
      return '$includes';
    }, [targetField]);

    const mapOptionsToTags = useCallback(
      (options) => {
        try {
          return options.map((option) => {
            let label = option[fieldNames.label];

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
                      return <Tag>{item}</Tag>;
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
              label = moment(label).format('YYYY-MM-DD');
            }

            if (mapOptions) {
              return mapOptions({
                [fieldNames.label]: label,
                [fieldNames.value]: option[fieldNames.value],
              });
            }
            return {
              ...option,
              [fieldNames.label]: label || option[fieldNames.value],
              [fieldNames.value]: option[fieldNames.value],
            };
          });
        } catch (err) {
          console.error(err);
          return options;
        }
      },
      [targetField?.uiSchema, fieldNames],
    );

    const { data, run, loading } = useRequest(
      {
        action: 'list',
        ...service,
        params: {
          pageSize: 200,
          ...service?.params,
          // fields: [fieldNames.label, fieldNames.value, ...(service?.params?.fields || [])],
          // search needs
          filter: mergeFilter([field.componentProps?.service?.params?.filter || service?.params?.filter]),
        },
      },
      {
        manual,
        debounceWait: wait,
      },
    );

    const runDep = useMemo(
      () =>
        JSON.stringify({
          service,
          fieldNames,
        }),
      [service, fieldNames],
    );

    useEffect(() => {
      // Lazy load
      if (firstRun.current) {
        run();
      }
    }, [runDep]);

    const onSearch = async (search) => {
      run({
        filter: mergeFilter([
          {
            [fieldNames.label]: {
              [operator]: search,
            },
          },
          field.componentProps?.service?.params?.filter || service?.params?.filter,
        ]),
      });
    };

    const getOptionsByFieldNames = useCallback(
      (item) => {
        return Object.keys(fieldNames).reduce((obj, key) => {
          return obj;
        }, {} as any);
      },
      [fieldNames],
    );
    const normalizeOptions = useCallback(
      (obj) => {
        if (objectValue || typeof obj === 'object') {
          return getOptionsByFieldNames(obj);
        }
        return { [fieldNames.value]: obj, [fieldNames.label]: obj };
      },
      [objectValue, getOptionsByFieldNames],
    );

    const options = useMemo(() => {
      if (!data?.data?.length) {
        return value !== undefined && value !== null ? (Array.isArray(value) ? value : [value]) : [];
      }
      const valueOptions = (value !== undefined && value !== null && (Array.isArray(value) ? value : [value])) || [];
      return uniqBy(data?.data?.concat(valueOptions) || [], fieldNames.value);
    }, [data?.data, getOptionsByFieldNames, normalizeOptions, value]);
    const onDropdownVisibleChange = () => {
      if (firstRun.current) {
        return;
      }
      run();
      firstRun.current = true;
    };

    return (
      <Select
        dropdownMatchSelectWidth={false}
        autoClearSearchValue
        filterOption={false}
        filterSort={null}
        fieldNames={fieldNames}
        onSearch={onSearch}
        onDropdownVisibleChange={onDropdownVisibleChange}
        objectValue={objectValue}
        value={value}
        {...others}
        loading={loading}
        options={mapOptionsToTags(options)}
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
        fieldNames: { ...defaultFieldNames, ...props.fieldNames, ...field.componentProps.fieldNames },
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty),
);

export const RemoteSelect = InternalRemoteSelect as unknown as typeof InternalRemoteSelect & {
  ReadPretty: typeof ReadPretty;
};

RemoteSelect.ReadPretty = ReadPretty;
export default RemoteSelect;
