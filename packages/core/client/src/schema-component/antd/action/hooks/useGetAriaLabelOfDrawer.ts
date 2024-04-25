import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useCompile } from '../../../hooks';

/**
 * label = 'drawer' + x-component + [collectionName] + [title] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfDrawer = () => {
  const fieldSchema = useFieldSchema();
  const component = fieldSchema['x-component'];
  const componentName = typeof component === 'string' ? component : component?.displayName || component?.name;
  const compile = useCompile();
  let { name: collectionName } = useCollection_deprecated();
  let title = compile(fieldSchema.title);
  collectionName = collectionName ? `-${collectionName}` : '';
  title = title ? `-${title}` : '';

  const getAriaLabel = useCallback(
    (postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';
      return `drawer-${componentName}${collectionName}${title}${postfix}`;
    },
    [collectionName, componentName, title],
  );

  return { getAriaLabel };
};
