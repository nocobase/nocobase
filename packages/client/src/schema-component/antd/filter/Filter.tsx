import { ObjectField as ObjectFieldModel } from '@formily/core';
import { observer, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useRequest } from '../../../api-client';
import { FilterContext } from './context';
import { FilterGroup } from './FilterGroup';
import { SaveDefaultValue } from './SaveDefaultValue';

const useDef = (options) => {
  const field = useField<ObjectFieldModel>();
  return useRequest(() => Promise.resolve({ data: field.dataSource }), options);
};

export const Filter: any = observer((props: any) => {
  const { useDataSource = useDef, dynamicComponent } = props;
  const field = useField<ObjectFieldModel>();
  const fieldSchema = useFieldSchema();
  useDataSource({
    onSuccess(data) {
      console.log('onSuccess', data?.data);
      field.dataSource = data?.data || [];
    },
  });
  return (
    <div>
      <FilterContext.Provider value={{ field, fieldSchema, dynamicComponent, options: field.dataSource || [] }}>
        <FilterGroup {...props} />
      </FilterContext.Provider>
      {/* <pre>{JSON.stringify(field.value, null, 2)}</pre> */}
    </div>
  );
});

Filter.SaveDefaultValue = SaveDefaultValue;
