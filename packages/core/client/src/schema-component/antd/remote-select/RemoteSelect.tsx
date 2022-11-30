import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { SelectProps } from 'antd';
import _ from 'lodash';
import React from 'react';
import { ResourceActionOptions, useRequest } from '../../../api-client';
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
    const { fieldNames, service = {}, wait = 300, ...others } = props;

    const { data, run } = useRequest(
      {
        action: 'list',
        ...service,
        params: {
          pageSize: 30,
          ...service?.params,
          // search needs
          filter: {
            $and: [service?.params?.filter].filter(Boolean),
          },
        },
      },
      {
        debounceWait: wait,
        refreshDeps: [service],
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

    return (
      <Select
        autoClearSearchValue
        filterOption={false}
        filterSort={null}
        fieldNames={fieldNames}
        onSearch={onSearch}
        {...others}
        options={data?.data || []}
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
