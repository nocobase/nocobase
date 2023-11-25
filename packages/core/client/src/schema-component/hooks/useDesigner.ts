import { useFieldSchema } from '@formily/react';
import { useComponent, useDesignable } from '.';
import { SchemaDesignerToolbar } from '../../schema-settings';

const Def = () => null;

export const useDesigner = () => {
  const { designable } = useDesignable();
  const fieldSchema = useFieldSchema();
  const component = useComponent(
    fieldSchema['x-designer'] ||
      fieldSchema['x-toolbar'] ||
      (fieldSchema['x-initializer'] || fieldSchema['x-settings'] ? SchemaDesignerToolbar : undefined),
    Def,
  );
  return designable ? component : Def;
};
