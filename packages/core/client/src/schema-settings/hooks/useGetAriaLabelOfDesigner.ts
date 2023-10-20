import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';

/**
 * label = 'designer' + name + x-component + [x-designer]  + [x-collection-field] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfDesigner = () => {
  const fieldSchema = useFieldSchema();
  const component = fieldSchema['x-component'];
  const designer = fieldSchema['x-designer'] ? `-${fieldSchema['x-designer']}` : '';
  const collectionField = fieldSchema['x-collection-field'] ? `-${fieldSchema['x-collection-field']}` : '';

  const getAriaLabel = useCallback(
    (name: string, postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';

      return `designer-${name}-${component}${designer}${collectionField}${postfix}`;
    },
    [collectionField, component, designer],
  );

  return { getAriaLabel };
};
