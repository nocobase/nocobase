/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useCallback } from 'react';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useCompile } from '../../../hooks';

/**
 * label = 'modal' + x-component + [collectionName] + [title] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfModal = () => {
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
      return `modal-${componentName}${collectionName}${title}${postfix}`;
    },
    [collectionName, componentName, title],
  );

  return { getAriaLabel };
};
