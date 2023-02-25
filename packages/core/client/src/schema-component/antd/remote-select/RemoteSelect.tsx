import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { SelectProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ResourceActionOptions, useRequest } from '../../../api-client';
import { useCompile } from '../../hooks';
import { defaultFieldNames, Select } from '../select';
import { ReadPretty } from './ReadPretty';

export type RemoteSelectProps<P = any> = SelectProps<P, any> & {
  objectValue?: boolean;
  onChange?: (v: any) => void;
  target: string;
  wait?: number;
  service: ResourceActionOptions<P>;
};

const InternalRemoteSelect = connect(
  (props: RemoteSelectProps) => {
    const { fieldNames = {}, service = {}, wait = 300, value, objectValue, ...others } = props;
    const compile = useCompile();
    const firstRun = useRef(false);

    const { data, run, loading } = useRequest(
      {
        action: 'list',
        ...service,
        params: {
          pageSize: 200,
          ...service?.params,
          // fields: [fieldNames.label, fieldNames.value, ...(service?.params?.fields || [])],
          // search needs
          filter: {
            $and: [service?.params?.filter].filter(Boolean),
          },
        },
      },
      {
        manual: true,
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
        filter: {
          $and: [
            {
              [fieldNames.label]: {
                $includes: search,
              },
            },
            service?.params?.filter,
          ].filter(Boolean),
        },
      });
    };

    const normalizeOptions = useCallback(
      (obj) => {
        if (objectValue || typeof obj === 'object') {
          return { ...obj, [fieldNames.label]: compile(obj[fieldNames.label]) };
        }
        return { [fieldNames.value]: obj, [fieldNames.label]: obj };
      },
      [objectValue, fieldNames.value],
    );

    const options = useMemo(() => {
      if (!data?.data?.length) {
        return value !== undefined && value !== null
          ? Array.isArray(value)
            ? value.map(normalizeOptions)
            : [normalizeOptions(value)]
          : [];
      }
      return (
        data?.data?.map((item) => ({
          ...item,
          [fieldNames.label]: compile(item[fieldNames.label]),
        })) || []
      );
    }, [data, fieldNames.label, objectValue, value]);

    const onDropdownVisibleChange = () => {
      if (firstRun.current) {
        return;
      }
      run();
      firstRun.current = true;
    };

    return (
      <Select
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
        options={options}
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
