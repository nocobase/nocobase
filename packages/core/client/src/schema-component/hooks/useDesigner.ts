import { useFieldSchema } from '@formily/react';
import { useComponent, useDesignable } from '.';
import { GeneralSchemaDesigner } from '../../schema-settings';

const Def = () => null;

export const useDesigner = () => {
  const { designable } = useDesignable();
  const fieldSchema = useFieldSchema();
  const component = useComponent(
    fieldSchema['x-designer'] ||
      fieldSchema['x-toolbar'] ||
      (fieldSchema['x-initializer'] || fieldSchema['x-settings'] ? GeneralSchemaDesigner : undefined),
    Def,
  );
  return designable ? component : Def;
};
