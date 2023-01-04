import { observer, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { getValues } from './shared';
import { Select, defaultFieldNames } from '../select';
import { useRequest } from '../../../api-client';
import { useRecord } from '../../../record-provider';
import { useActionContext } from '../action';

export const ReadPretty = observer((props: any) => {
  const fieldNames = { ...defaultFieldNames, ...props.fieldNames };
  const field = useField<any>();
  const fieldSchema = useFieldSchema();
  const record = useRecord();
  const { snapshot } = useActionContext();

  const { data } = useRequest(
    snapshot
      ? async () => ({
          data: record[fieldSchema.name],
        })
      : {
          action: 'list',
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
