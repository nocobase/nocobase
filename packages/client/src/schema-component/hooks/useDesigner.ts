import { useFieldSchema } from '@formily/react';
import { useComponent } from '.';

const Def = () => null;

export const useDesigner = () => {
  const fieldSchema = useFieldSchema();
  return useComponent(fieldSchema['x-designer'], Def);
};
