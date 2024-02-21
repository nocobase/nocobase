import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useFieldSchema } from '@formily/react';
import { Divider, SelectProps, Tag } from 'antd';
import dayjs from 'dayjs';
import { uniqBy } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ResourceActionOptions, useRequest } from '../../../api-client';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { mergeFilter } from '../../../filter-provider/utils';
import { useCompile } from '../../hooks';
import { Select, defaultFieldNames } from '../select';
import { ReadPretty } from './ReadPretty';
import { useDataSourceHeaders } from '../../../data-source/utils';
import { useDataSourceKey } from '../../../data-source/data-source/DataSourceProvider';
const EMPTY = 'N/A';

export type RemoteSelectProps<P = any> = SelectProps<P, any> & {
  objectValue?: boolean;
  onChange?: (v: any) => void;
  target: string;
  wait?: number;
  manual?: boolean;
  mapOptions?: (data: any) => RemoteSelectProps['fieldNames'];
  targetField?: any;
  service: ResourceActionOptions<P>;
  CustomDropdownRender?: (v: any) => any;
  optionFilter?: (option: any) => boolean;
};

const InternalRemoteSelect = connect(
  (props: RemoteSelectProps) => {
    const {
      fieldNames = {},
      service = {},
      wait = 300,
      value,
      defaultValue,
      objectValue,
      manual = true,
      mapOptions,
      targetField: _targetField,
      CustomDropdownRender,
      optionFilter,
      ...others
    } = props;
    const dataSource = useDataSourceKey();
    const headers = useDataSourceHeaders(dataSource);
    const [open, setOpen] = useState(false);
    const firstRun = useRef(false);
    const fieldSchema = useFieldSchema();
    const isQuickAdd = fieldSchema['x-component-props']?.addMode === 'quickAdd';
    const { getField } = useCollection_deprecated();
    const searchData = useRef(null);
    const { getCollectionJoinField, getInterface } = useCollectionManager_deprecated();
    const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema.name as string);
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
    const compile = useCompile();

    const mapOptionsToTags = useCallback(
      (options) => {
        try {
          return options
            .filter((v) => ['number', 'string'].includes(typeof v[fieldNames.value]))
            .map((option) => {
              let label = compile(option[fieldNames.label]);

              if (targetField?.uiSchema?.enum) {
                if (Array.isArray(label)) {
                  label = label
                    .map((item, index) => {
                      const option = targetField.uiSchema.enum.find((i) => i.value === item);
                      if (option) {
                        return (
                          <Tag role="button" key={index} color={option.color} style={{ marginRight: 3 }}>
                            {option?.label || item}
                          </Tag>
                        );
                      } else {
                        return (
                          <Tag role="button" key={item}>
                            {item}
                          </Tag>
                        );
                      }
                    })
                    .reverse();
                } else {
                  const item = targetField.uiSchema.enum.find((i) => i.value === label);
                  if (item) {
                    label = (
                      <Tag role="button" color={item.color}>
                        {item.label}
                      </Tag>
                    );
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
    const { data, run, loading } = useRequest(
      {
        action: 'list',
        ...service,
        headers,
        params: {
          pageSize: 200,
          ...service?.params,
          filter: service?.params?.filter,
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
    const CustomRenderCom = useCallback(() => {
      if (searchData.current && CustomDropdownRender) {
        return (
          <CustomDropdownRender
            search={searchData.current}
            callBack={() => {
              searchData.current = null;
              setOpen(false);
            }}
          />
        );
      }
      return null;
    }, [searchData.current]);

    useEffect(() => {
      // Lazy load
      if (firstRun.current) {
        run();
      }
    }, [runDep]);

    const onSearch = async (search) => {
      run({
        filter: mergeFilter([
          search
            ? {
                [fieldNames.label]: {
                  [operator]: search,
                },
              }
            : {},
          service?.params?.filter,
        ]),
      });
      searchData.current = search;
    };

    const options = useMemo(() => {
      const v = value || defaultValue;
      if (!data?.data?.length) {
        return v != null ? (Array.isArray(v) ? v : [v]) : [];
      }
      const valueOptions =
        (v != null && (Array.isArray(v) ? v : [{ ...v, [fieldNames.value]: v[fieldNames.value] || v }])) || [];
      const filtered = typeof optionFilter === 'function' ? data.data.filter(optionFilter) : data.data;
      return uniqBy(filtered.concat(valueOptions ?? []), fieldNames.value);
    }, [value, defaultValue, data?.data, fieldNames.value, optionFilter]);
    const onDropdownVisibleChange = (visible) => {
      setOpen(visible);
      searchData.current = null;
      if (visible) {
        run();
      }
      firstRun.current = true;
    };
    return (
      <Select
        open={open}
        popupMatchSelectWidth={false}
        autoClearSearchValue
        filterOption={false}
        filterSort={null}
        fieldNames={fieldNames as any}
        onSearch={onSearch}
        onDropdownVisibleChange={onDropdownVisibleChange}
        objectValue={objectValue}
        value={value}
        defaultValue={defaultValue}
        {...others}
        loading={data! ? loading : true}
        options={mapOptionsToTags(options)}
        rawOptions={options}
        dropdownRender={(menu) => {
          const isFullMatch = options.some((v) => v[fieldNames.label] === searchData.current);
          return (
            <>
              {isQuickAdd ? (
                <>
                  {!(data?.data.length === 0 && searchData?.current) && menu}
                  {data?.data.length > 0 && searchData?.current && !isFullMatch && <Divider style={{ margin: 0 }} />}
                  {!isFullMatch && <CustomRenderCom />}
                </>
              ) : (
                menu
              )}
            </>
          );
        }}
      />
    );
  },
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      const fieldSchema = useFieldSchema();
      return {
        ...props,
        fieldNames: {
          ...defaultFieldNames,
          ...field.componentProps.fieldNames,
          ...fieldSchema['x-component-props']?.fieldNames,
          ...props.fieldNames,
        },
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
