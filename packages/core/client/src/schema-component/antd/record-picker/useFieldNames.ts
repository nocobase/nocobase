import { useFieldSchema } from "@formily/react";

export const useFieldNames = (props) => {
  const fieldSchema = useFieldSchema();
  const fieldNames = fieldSchema['x-component-props']?.['field']?.['uiSchema']?.['x-component-props']?.['fieldNames']
  || fieldSchema?.['x-component-props']?.['fieldNames'] 
  || props.fieldNames;
  return { label: 'label', value: 'value', ...fieldNames };
};
