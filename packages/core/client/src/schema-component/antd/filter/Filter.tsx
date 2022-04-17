import { ObjectField as ObjectFieldModel } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useRequest } from '../../../api-client';
import { useProps } from '../../hooks/useProps';
import { FilterContext } from './context';
import { FilterActionDesigner } from './Filter.Action.Designer';
import { FilterAction } from './FilterAction';
import { FilterGroup } from './FilterGroup';
import { SaveDefaultValue } from './SaveDefaultValue';

const useDef = (options) => {
  const field = useField<ObjectFieldModel>();
  return useRequest(() => Promise.resolve({ data: field.dataSource }), options);
};

export const Filter: any = observer((props: any) => {
  const { useDataSource = useDef } = props;
  const { options, dynamicComponent, className } = useProps(props);
  const field = useField<ObjectFieldModel>();
  const fieldSchema = useFieldSchema();
  useDataSource({
    onSuccess(data) {
      field.dataSource = data?.data || [];
    },
  });
  return (
    <div className={className}>
      <FilterContext.Provider
        value={{ field, fieldSchema, dynamicComponent, options: options || field.dataSource || [] }}
      >
        <FilterGroup {...props} bordered={false} />
        {/* <pre>{JSON.stringify(field.value, null, 2)}</pre> */}
      </FilterContext.Provider>
    </div>
  );
});

Filter.SaveDefaultValue = SaveDefaultValue;

Filter.Action = FilterAction;
Filter.Action.Designer = FilterActionDesigner;
