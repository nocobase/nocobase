import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useCallback } from 'react';
import { useBlockContext } from '../../../../block-provider/BlockProvider';
import { useCompile } from '../../../hooks';
import { useCollectionV2 } from '../../../../application';

/**
 * label = 'block-item' + x-component + [collectionName] + [blockName] + [x-collection-field] + [title] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfBlockItem = (name?: string) => {
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const component = _.isString(fieldSchema['x-component'])
    ? fieldSchema['x-component']
    : fieldSchema['x-component']?.displayName;
  const collectionField = compile(fieldSchema['x-collection-field']);
  let { name: blockName } = useBlockContext() || {};
  const collection = useCollectionV2();
  blockName = name || blockName;

  const title = compile(fieldSchema['title']) || compile(collection.getField(fieldSchema.name)?.uiSchema?.title);

  const getAriaLabel = useCallback(
    (postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';
      return ['block-item', component, collection?.name, blockName, collectionField, title, postfix]
        .filter(Boolean)
        .join('-');
    },
    [component, collection, blockName, collectionField, title],
  );

  return {
    getAriaLabel,
  };
};
