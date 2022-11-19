import { observer, useField } from '@formily/react';
import React from 'react';
import { useRequest } from '@nocobase/client';
import { getValues } from './shared';
import { Select, defaultFieldNames } from '../select';

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
            $in: getValues(field.value, fieldNames),
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
