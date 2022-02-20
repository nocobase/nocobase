import { useFieldSchema } from '@formily/react';
import { useComponent, useDesignable } from '.';

const Def = () => null;

export const useDesigner = () => {
  const { designable } = useDesignable();
  const fieldSchema = useFieldSchema();
  const component = useComponent(fieldSchema['x-designer'], Def);
  return designable ? component : Def;
};
