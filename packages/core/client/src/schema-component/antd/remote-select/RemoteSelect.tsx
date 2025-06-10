/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, useFieldSchema } from '@formily/react';
import { Divider, Tag } from 'antd';
import dayjs from 'dayjs';
import { uniqBy, omit } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ResourceActionOptions, useRequest } from '../../../api-client';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { useDataSourceKey } from '../../../data-source/data-source/DataSourceProvider';
import { useDataSourceHeaders } from '../../../data-source/utils';
import { mergeFilter } from '../../../filter-provider/utils';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useCompile } from '../../hooks';
import { defaultFieldNames, FieldNames, Select, SelectProps } from '../select';
import { ReadPretty } from './ReadPretty';
const EMPTY = 'N/A';

export type RemoteSelectProps<P = any> = SelectProps<P, any> & {
  onChange?: (v: any) => void;
  /**
   * useRequest() `debounceWait` parameter
   */
  wait?: number;
  /**
   * useRequest() `manual` parameter
   * @default true
   */
  manual?: boolean;
  targetField?: any;
  /**
   * useRequest() `service` parameter
   */
  service: ResourceActionOptions<P> & {
    defaultParams?: any;
  };
  target: string;
  mapOptions?: (data: any) => SelectProps['fieldNames'];
  dataSource?: string;
  CustomDropdownRender?: (v: any) => any;
  optionFilter?: (option: any) => boolean;
  toOptionsItem?: (data) => any;
  onSuccess?: (data) => any;
};

const InternalRemoteSelect = withDynamicSchemaProps(
  connect(
    (props: RemoteSelectProps) => {
      const {
        fieldNames = {} as FieldNames,
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
        dataSource: propsDataSource,
        toOptionsItem = (value) => value,
        popupMatchSelectWidth = false,
        onSuccess,
        ...others
      } = props;
      const dataSource = useDataSourceKey();
      const headers = useDataSourceHeaders(propsDataSource || dataSource);
      const firstRun = useRef(false);
      const fieldSchema = useFieldSchema();
      const isQuickAdd = fieldSchema['x-component-props']?.addMode === 'quickAdd';
      const { getField } = useCollection_deprecated();
      const searchData = useRef(null);
      const { getCollectionJoinField, getInterface } = useCollectionManager_deprecated();
      const colletionFieldName = fieldSchema['x-collection-field'] || fieldSchema.name;
      const collectionField = getField(colletionFieldName) || getCollectionJoinField(colletionFieldName);
      const targetField =
        _targetField ||
        (collectionField?.target &&
          fieldNames?.label &&
          getCollectionJoinField(`${collectionField.target}.${fieldNames.label}`));

      const operator = useMemo(() => {
        if (targetField?.interface) {
          const targetInterface = getInterface(targetField.interface);
          const initialOperator = targetInterface?.filterable?.operators[0].value || '$includes';
          if (targetField.type === 'string') {
            return '$includes';
          }
          return initialOperator;
        }
        return '$includes';
      }, [targetField]);
      const compile = useCompile();

      const mapOptionsToTags = useCallback(
        (options) => {
          try {
            return options
              .filter((v) => {
                return ['number', 'string'].includes(typeof v[fieldNames.value]) || !v[fieldNames.value];
              })
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
                  ...omit(option, 'style'),
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
          onSuccess,
          ...(service.defaultParams ? { defaultParams: [service.defaultParams] } : {}),
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
          (v != null &&
            (Array.isArray(v)
              ? v.map((item) => ({ ...item, [fieldNames.value]: item[fieldNames.value] || item }))
              : [{ ...v, [fieldNames.value]: v[fieldNames.value] || v }])) ||
          [];
        const filtered = typeof optionFilter === 'function' ? data.data.filter(optionFilter) : data.data;
        return uniqBy(filtered.concat(valueOptions ?? []), fieldNames.value);
      }, [value, defaultValue, data?.data, fieldNames.value, optionFilter]);

      const onDropdownVisibleChange = (visible) => {
        searchData.current = null;
        if (visible) {
          run();
        }
        firstRun.current = true;
      };

      return (
        <Select
          popupMatchSelectWidth={popupMatchSelectWidth}
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
          options={toOptionsItem(mapOptionsToTags(options))}
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
            ...props.fieldNames,
            ...field.componentProps.fieldNames,
            ...fieldSchema['x-component-props']?.fieldNames,
          },
          suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffixIcon,
        };
      },
    ),
    mapReadPretty(ReadPretty),
  ),
);

export const RemoteSelect = InternalRemoteSelect as unknown as typeof InternalRemoteSelect & {
  ReadPretty: typeof ReadPretty;
};

RemoteSelect.ReadPretty = ReadPretty;
export default RemoteSelect;
