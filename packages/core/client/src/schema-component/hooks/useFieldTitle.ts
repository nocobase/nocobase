/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useEffect } from 'react';
import { useCollectionManager } from '../../data-source/collection/CollectionManagerProvider';
import { useCollection } from '../../data-source/collection/CollectionProvider';
import { useCompile } from './useCompile';

export const useFieldTitle = () => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const collection = useCollection();
  const cm = useCollectionManager();
  const collectionField =
    collection?.getField(fieldSchema['name']) || cm?.getCollectionField(fieldSchema['x-collection-field']);
  const compile = useCompile();
  useEffect(() => {
    if (!field?.title) {
      field.title = compile(collectionField?.uiSchema?.title);
    }
  }, [collectionField?.uiSchema?.title]);
};
