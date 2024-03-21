import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useCompile } from '../../../hooks';

/**
 * label = 'popover' + x-component + [collectionName] + [title] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfPopover = () => {
  const fieldSchema = useFieldSchema();
  const component = fieldSchema['x-component'];
  const compile = useCompile();
  let { name: collectionName } = useCollection_deprecated();
  let title = compile(fieldSchema.title);
  collectionName = collectionName ? `-${collectionName}` : '';
  title = title ? `-${title}` : '';

  const getAriaLabel = useCallback(
    (postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';
      return `popover-${component}${collectionName}${title}${postfix}`;
    },
    [collectionName, component, title],
  );

  return { getAriaLabel };
};
