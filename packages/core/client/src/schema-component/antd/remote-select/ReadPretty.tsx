import { isArrayField } from '@formily/core';
import { observer, useField } from '@formily/react';
import { isValid } from '@formily/shared';
import { Tag } from 'antd';
import React from 'react';
import { useRequest } from '@nocobase/client';
import { defaultFieldNames, getCurrentOptions } from './shared';
import Select from '../select/Select';

export const ReadPretty = observer((props: any) => {
  const fieldNames = { ...defaultFieldNames, ...props.fieldNames };
  const field = useField<any>();

  const { data } = useRequest(
    {
      ...props.service,
      params: {
        paginate: false,
        filter: {
          [fieldNames.value]: {
            $in: [field.value],
          },
        },
      },
    },
    {
      refreshDeps: [props.service, field.value],
    },
  );

  return <Select.ReadPretty {...props} options={data?.data}></Select.ReadPretty>;
});
