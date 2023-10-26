import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useBlockContext } from '../../../../block-provider/BlockProvider';
import { useCollection } from '../../../../collection-manager';
import { useCompile } from '../../../hooks';

/**
 * label = 'block-item' + x-component + [collectionName] + [blockName] + [x-collection-field] + [title] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfBlockItem = (name?: string) => {
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const component = fieldSchema['x-component'];
  const collectionField = compile(fieldSchema['x-collection-field'])
    ? `-${compile(fieldSchema['x-collection-field'])}`
    : '';
  const title = compile(fieldSchema['title']) ? `-${compile(fieldSchema['title'])}` : '';
  let { name: blockName } = useBlockContext() || {};
  let { name: collectionName } = useCollection();
  collectionName = collectionName ? `-${collectionName}` : '';
  blockName = name || blockName;
  blockName = blockName ? `-${blockName}` : '';

  const getAriaLabel = useCallback(
    (postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';
      return `block-item-${component}${collectionName}${blockName}${collectionField}${title}${postfix}`;
    },
    [component, collectionName, blockName, collectionField, title],
  );

  return {
    getAriaLabel,
  };
};
