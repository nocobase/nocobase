import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useBlockContext } from '../../../../block-provider';
import { useCollection } from '../../../../collection-manager';
import { useCompile } from '../../../hooks';

/**
 * label = 'action' + x-component + x-action + actionTitle + [collectionName] + [blockName] + [postfix]
 * @param title
 * @returns
 */
export const useGetAriaLabelOfAction = (title: string) => {
  const fieldSchema = useFieldSchema();
  const component = fieldSchema['x-component'];
  const action = fieldSchema['x-action'];
  const compile = useCompile();
  let { name: collectionName } = useCollection();
  let { name: blockName } = useBlockContext();
  const actionTitle = title || compile(fieldSchema.title);
  collectionName = collectionName ? `-${collectionName}` : '';
  blockName = blockName ? `-${blockName}` : '';

  const getAriaLabel = useCallback(
    (postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';
      return `action-${component}-${action}-${actionTitle}${collectionName}${blockName}${postfix}`;
    },
    [action, actionTitle, blockName, collectionName, component],
  );

  return {
    getAriaLabel,
  };
};
