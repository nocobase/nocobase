import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useCallback } from 'react';
import { useBlockContext } from '../../../../block-provider/BlockProvider';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useCompile } from '../../../hooks';

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
  // eslint-disable-next-line prefer-const
  let { name: collectionName, getField } = useCollection_deprecated();
  blockName = name || blockName;

  const title = compile(fieldSchema['title']) || compile(getField(fieldSchema.name)?.uiSchema?.title);

  const getAriaLabel = useCallback(
    (postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';
      return ['block-item', component, collectionName, blockName, collectionField, title, postfix]
        .filter(Boolean)
        .join('-');
    },
    [component, collectionName, blockName, collectionField, title],
  );

  return {
    getAriaLabel,
  };
};
