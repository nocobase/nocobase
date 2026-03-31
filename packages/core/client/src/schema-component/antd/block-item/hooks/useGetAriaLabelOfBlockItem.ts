/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
  const component = fieldSchema['x-component'];
  const componentName = typeof component === 'string' ? component : component?.displayName;
  const collectionField = compile(fieldSchema['x-collection-field']);
  let { name: blockName } = useBlockContext() || {};
  // eslint-disable-next-line prefer-const
  let { name: collectionName, getField } = useCollection_deprecated();
  blockName = name || (blockName !== 'action' ? blockName : '');

  const title = compile(fieldSchema['title']) || compile(getField(fieldSchema.name)?.uiSchema?.title);

  const getAriaLabel = useCallback(
    (postfix?: string) => {
      postfix = postfix ? `-${postfix}` : '';
      return ['block-item', componentName, collectionName, blockName, collectionField, title, postfix]
        .filter(Boolean)
        .join('-');
    },
    [componentName, collectionName, blockName, collectionField, title],
  );

  return {
    getAriaLabel,
  };
};
