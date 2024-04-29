import { ObjectField as ObjectFieldModel } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { useRequest } from '../../../api-client';
import { useProps } from '../../hooks/useProps';
import { FilterActionDesigner } from './Filter.Action.Designer';
import { FilterAction } from './FilterAction';
import { FilterGroup } from './FilterGroup';
import { SaveDefaultValue } from './SaveDefaultValue';
import { FilterContext } from './context';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

const useDef = (options) => {
  const field = useField<ObjectFieldModel>();
  return useRequest(() => Promise.resolve({ data: field.dataSource }), options);
};

export const Filter: any = withDynamicSchemaProps(
  observer((props: any) => {
    const { useDataSource = useDef } = props;

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
  { displayName: 'Filter' },
);

Filter.SaveDefaultValue = SaveDefaultValue;

Filter.Action = FilterAction;
Filter.Action.Designer = FilterActionDesigner;
