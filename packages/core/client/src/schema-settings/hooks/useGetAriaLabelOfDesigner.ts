import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useCollectionV2 } from '../../application';

/**
 * label = 'designer' + name + x-component + [x-designer] + [collectionName] + [x-collection-field] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfDesigner = () => {
  const fieldSchema = useFieldSchema();
  const collection = useCollectionV2();
  const getAriaLabel = useCallback(
    (name: string, postfix?: string) => {
      if (!fieldSchema) return '';

      const component = fieldSchema['x-component'];
      const designer = fieldSchema['x-designer'] ? `-${fieldSchema['x-designer']}` : '';
      const collectionField = fieldSchema['x-collection-field'] ? `-${fieldSchema['x-collection-field']}` : '';
      const collectionName = collection?.name ? `-${collection.name}` : '';
      postfix = postfix ? `-${postfix}` : '';

      return `designer-${name}-${component}${designer}${collectionName}${collectionField}${postfix}`;
    },
    [fieldSchema, collection?.name],
  );

  return { getAriaLabel };
};
