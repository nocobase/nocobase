import React from 'react';
import { useCompile, Variable } from '@nocobase/client';



export const Expression = (props) => {
  const { value = '', supports, useCurrentFields, onChange } = props;
  const compile = useCompile();

  const fields = useCurrentFields().filter(field => supports.includes(field.interface));

  const options = fields.map(field => ({
    label: compile(field.uiSchema.title),
    value: field.name
  }));

  return (
    <Variable.TextArea
      value={value}
      onChange={onChange}
      scope={options}
    />
  );
};

export default Expression;
