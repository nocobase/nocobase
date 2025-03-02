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
import { useCollection_deprecated } from '../../collection-manager';

/**
 * label = 'designer' + name + x-component + [x-designer] + [collectionName] + [x-collection-field] + [postfix]
 * @returns
 */
export const useGetAriaLabelOfDesigner = () => {
  const fieldSchema = useFieldSchema();
  const { name: _collectionName } = useCollection_deprecated();
  const getAriaLabel = useCallback(
    (name: string, postfix?: string) => {
      if (!fieldSchema) return `designer-${name}-${postfix}`;

      const component = fieldSchema['x-component'];
      const componentName = typeof component === 'string' ? component : component?.displayName || component?.name;
      const designer = fieldSchema['x-designer'] ? `-${fieldSchema['x-designer']}` : '';
      const settings = fieldSchema['x-settings'] ? `-${fieldSchema['x-settings']}` : '';
      const collectionField = fieldSchema['x-collection-field'] ? `-${fieldSchema['x-collection-field']}` : '';
      const collectionName = _collectionName ? `-${_collectionName}` : '';
      postfix = postfix ? `-${postfix}` : '';

      return `designer-${name}-${componentName}${designer}${settings}${collectionName}${collectionField}${postfix}`;
    },
    [fieldSchema, _collectionName],
  );

  return { getAriaLabel };
};
