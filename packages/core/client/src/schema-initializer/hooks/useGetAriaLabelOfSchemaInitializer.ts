import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useCollectionV2 } from '../../application';

/**
 * label = 'schema-initializer' + x-component + [x-initializer] + [collectionName] + [postfix]
 * @returns
 */

export const useGetAriaLabelOfSchemaInitializer = () => {
  const fieldSchema = useFieldSchema();
  const collection = useCollectionV2();
  const getAriaLabel = useCallback(
    (postfix?: string) => {
      if (!fieldSchema) return '';
      const initializer = fieldSchema['x-initializer'] ? `-${fieldSchema['x-initializer']}` : '';
      const collectionName = collection?.name ? `-${collection?.name}` : '';
      postfix = postfix ? `-${postfix}` : '';

      return `schema-initializer-${fieldSchema['x-component']}${initializer}${collectionName}${postfix}`;
    },
    [fieldSchema, collection?.name],
  );

  return { getAriaLabel };
};
