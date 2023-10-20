import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useBlockContext } from '../../../../block-provider';
import { useCollection } from '../../../../collection-manager';

/**
 * label = 'block-item' + x-component + [collectionName] + [blockName] + [x-collection-field] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfBlockItem = (name?: string) => {
  const fieldSchema = useFieldSchema();
  const component = fieldSchema['x-component'];
  const collectionField = fieldSchema['x-collection-field'] ? `-${fieldSchema['x-collection-field']}` : '';
  let { name: blockName } = useBlockContext() || {};
  let { name: collectionName } = useCollection();
  collectionName = collectionName ? `-${collectionName}` : '';
  blockName = name || blockName;
  blockName = blockName ? `-${blockName}` : '';

  const getAriaLabel = useCallback(
    (postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';
      return `block-item-${component}${collectionName}${blockName}${collectionField}${postfix}`;
    },
    [blockName, collectionField, collectionName, component],
  );

  return {
    getAriaLabel,
  };
};
