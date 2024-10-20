/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { ResourceActionOptions, useRequest } from '../../../api-client';
import { useRecord } from '../../../record-provider';
import { useActionContext } from '../action';
import { Select, defaultFieldNames } from '../select';
import { getValues } from './shared';
import { SelectProps } from 'antd';
import { SelectReadPrettyProps } from '../select/ReadPretty';

export interface RemoteSelectReadPrettyProps extends SelectReadPrettyProps {
  fieldNames?: SelectProps['fieldNames'];
  service: ResourceActionOptions;
}

export const ReadPretty = observer(
  (props: RemoteSelectReadPrettyProps) => {
    const fieldNames = { ...defaultFieldNames, ...props.fieldNames };
    const field = useField<any>();
    const fieldSchema = useFieldSchema();
    const record = useRecord();
    const { snapshot } = useActionContext();

    const { data } = useRequest<{
      data: any[];
    }>(
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
  },
  { displayName: 'ReadPretty' },
);
