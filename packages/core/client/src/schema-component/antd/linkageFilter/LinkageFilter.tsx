/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ObjectField as ObjectFieldModel } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { UseRequestOptions, useRequest } from '../../../api-client';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useProps } from '../../hooks/useProps';
import { FilterGroup } from './FilterGroup';
import { FilterContext } from './context';

const useDef = (options: UseRequestOptions) => {
  const field = useField<ObjectFieldModel>();
  return useRequest(() => Promise.resolve({ data: field.dataSource }), options);
};

export const LinkageFilter: any = withDynamicSchemaProps(
  observer((props: any) => {
    const { useDataSource = useDef, conditionType } = props;

    // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { options, dynamicComponent, className, collectionName } = useProps(props);

    const field = useField<ObjectFieldModel>();
    const fieldSchema: any = useFieldSchema();
    useDataSource({
      onSuccess(data) {
        field.dataSource = data?.data || [];
      },
    });

    useEffect(() => {
      if (fieldSchema.defaultValue) {
        field.initialValue = fieldSchema.defaultValue;
      }
    }, [fieldSchema.defaultValue]);

    return (
      <div className={className}>
        <FilterContext.Provider
          value={{
            field,
            fieldSchema,
            dynamicComponent,
            options: options || field.dataSource || [],
            disabled: props.disabled,
            collectionName,
          }}
        >
          <FilterGroup {...props} bordered={false} />
        </FilterContext.Provider>
      </div>
    );
  }),
  { displayName: 'LinkageFilter' },
);
