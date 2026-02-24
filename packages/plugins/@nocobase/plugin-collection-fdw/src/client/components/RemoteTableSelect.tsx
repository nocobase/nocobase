/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React, { useState, useEffect, memo } from 'react';
import { Select, Spin, Empty } from 'antd';
import { useForm } from '@formily/react';
import { useAPIClient } from '@nocobase/client';

export const RemoteTableSelect = memo((props:any) => {
  const { remoteServerName, onChange, disabled } = props;
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState(props.value);
  const [loading, setLoading] = useState(false);
  const api = useAPIClient();
  const form = useForm();
  useEffect(() => {
    try {
      if (remoteServerName) {
        setLoading(true);
        api
          .resource(`databaseServers/${remoteServerName}/tables`)
          .list()
          .then(({ data }) => {
            setOptions(
              data?.data.map((option) => {
                return { ...options, customLabel: option.schema ? `${option.schema}.${option.name}` : option.name };
              }),
            );
            setValue(props.value);
            setLoading(false);
          });
      } else {
        setOptions([]);
        form.setValuesIn('remoteTableName', null);
        onChange?.(null);
        setValue(null);
      }
    } catch (error) {
      console.log(error);
    }
  }, [remoteServerName]);
  return (
    <Select
      virtual
      disabled={disabled}
      showSearch
      optionFilterProp="customLabel"
      filterOption={(input, option) => {
        return option.customLabel.toLowerCase().indexOf(input.toLowerCase()) >= 0;
      }}
      notFoundContent={loading ? <Spin /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      options={options}
      value={value}
      onChange={(value) => {
        if (value) {
          const remoteTable = value.includes('.') ? value.split('.') : [null, value];
          form.setValuesIn('remoteTableName', value);
          form.setValuesIn('remoteTableInfo', { tableName: remoteTable[1], schema: remoteTable[0] });
          onChange?.(value);
          setValue(value);
        } else {
          form.setValuesIn('remoteTableName', null);
          form.setValuesIn('remoteTableInfo', {});
        }
      }}
      fieldNames={{ label: 'customLabel', value: 'customLabel' }}
      style={{ width: '100%' }}
    />
  );
});
