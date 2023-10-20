import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useCollection } from '../../collection-manager';

/**
 * label = 'designer' + name + x-component + [x-designer] + [collectionName] + [x-collection-field] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfDesigner = () => {
  const fieldSchema = useFieldSchema();
  let { name: collectionName } = useCollection();
  const component = fieldSchema['x-component'];
  const designer = fieldSchema['x-designer'] ? `-${fieldSchema['x-designer']}` : '';
  const collectionField = fieldSchema['x-collection-field'] ? `-${fieldSchema['x-collection-field']}` : '';
  collectionName = collectionName ? `-${collectionName}` : '';

  const getAriaLabel = useCallback(
    (name: string, postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';

      return `designer-${name}-${component}${designer}${collectionName}${collectionField}${postfix}`;
    },
    [collectionField, collectionName, component, designer],
  );

  return { getAriaLabel };
};
