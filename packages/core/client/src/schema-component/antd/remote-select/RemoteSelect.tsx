import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { SelectProps } from 'antd';
import React, { useMemo } from 'react';
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
    const { fieldNames = {}, service = {}, wait = 300, ...others } = props;
    const compile = useCompile();

    const { data, run } = useRequest(
      {
        action: 'list',
        ...service,
        params: {
          pageSize: 200,
          ...service?.params,
          fields: [fieldNames.label, fieldNames.value, ...(service?.params?.fields || [])],
          // search needs
          filter: {
            $and: [service?.params?.filter].filter(Boolean),
          },
        },
      },
      {
        debounceWait: wait,
        refreshDeps: [service, fieldNames.label, fieldNames.value],
      },
    );

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

    const options = useMemo(() => {
      return (
        data?.data?.map((item) => ({
          ...item,
          [fieldNames.label]: compile(item[fieldNames.label]),
        })) || []
      );
    }, [data, fieldNames.label]);

    return (
      <Select
        autoClearSearchValue
        filterOption={false}
        filterSort={null}
        fieldNames={fieldNames}
        onSearch={onSearch}
        {...others}
        options={options}
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
