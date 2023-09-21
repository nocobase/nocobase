import { useFieldSchema } from '@formily/react';
import { useCallback, useState } from 'react';
import { useComponent, useDesignable } from '.';

const Def = () => null;

export const useDesigner = () => {
  const { designable } = useDesignable();
  const fieldSchema = useFieldSchema();
  const component = useComponent(fieldSchema['x-designer'], Def);
  return designable ? component : Def;
};

export const useDesignerControl = () => {
  const [designerVisible, setDesignerVisible] = useState(false);

  const showDesigner = useCallback(() => setDesignerVisible(true), []);
  const hideDesigner = useCallback(() => setDesignerVisible(false), []);

  return { designerVisible, showDesigner, hideDesigner };
};
