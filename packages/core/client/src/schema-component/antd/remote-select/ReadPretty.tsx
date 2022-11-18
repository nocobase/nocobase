import { isArrayField } from '@formily/core';
import { observer, useField } from '@formily/react';
import { isValid } from '@formily/shared';
import { Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useAPIClient } from '../../../api-client';
import { defaultFieldNames, getCurrentOptions } from './shared';

export const ReadPretty = observer((props: any) => {
  const fieldNames = { ...defaultFieldNames, ...props.fieldNames };

  const api = useAPIClient();
  const resource = useMemo(() => {
    return api.resource((props as any).target);
  }, [props.target, api]);

  const field = useField<any>();
  if (!isValid(props.value)) {
    return <div />;
  }
  if (isArrayField(field) && field?.value?.length === 0) {
    return <div />;
  }
  const [dataSource, setDataSource] = useState([]);

  useEffect(() => {
    resource
      .list({
        paginate: false,
        filter: {
          [fieldNames.value]: {
            $eq: field.value,
          },
        },
      })
      .then((res) => {
        setDataSource(res.data.data);
      });
  }, [field.value]);

  const options = getCurrentOptions(field.value, dataSource, fieldNames);
  return (
    <div>
      {options.map((option, key) => (
        <Tag key={key} color={option[fieldNames.color]} icon={option.icon}>
          {option[fieldNames.label]}
        </Tag>
      ))}
    </div>
  );
});
