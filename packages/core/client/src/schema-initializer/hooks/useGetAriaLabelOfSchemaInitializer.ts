import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useCollection_deprecated } from '../../collection-manager';

/**
 * label = 'schema-initializer' + x-component + [x-initializer] + [collectionName] + [postfix]
 * @returns
 */

export const useGetAriaLabelOfSchemaInitializer = () => {
  const fieldSchema = useFieldSchema();
  const { name } = useCollection_deprecated();
  const getAriaLabel = useCallback(
    (postfix?: string) => {
      if (!fieldSchema) return '';
      const component = fieldSchema['x-component'];
      const componentStr = typeof component === 'string' ? component : component?.displayName || component.name;
      const initializer = fieldSchema['x-initializer'] ? `-${fieldSchema['x-initializer']}` : '';
      const collectionName = name ? `-${name}` : '';
      postfix = postfix ? `-${postfix}` : '';

      return `schema-initializer-${componentStr}${initializer}${collectionName}${postfix}`;
    },
    [fieldSchema, name],
  );

  return { getAriaLabel };
};
