import React from 'react';
import { useCollectionManagerV2, useCompile, Variable } from '@nocobase/client';

export const Expression = (props) => {
  const { value = '', supports = [], useCurrentFields, onChange } = props;
  const compile = useCompile();
  const cm = useCollectionManagerV2();

  const fields = (useCurrentFields?.() ?? []).filter((field) => supports.includes(field.interface));

  const options = fields.map((field) => ({
    label: compile(field.uiSchema.title),
    value: field.name,
    children: cm.getCollectionFieldInterface(field.interface)?.usePathOptions?.(field),
  }));

  return <Variable.TextArea value={value} onChange={onChange} scope={options} />;
};

export default Expression;
