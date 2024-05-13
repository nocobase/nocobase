/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient } from '../../api-client';
import { useCollectionField } from '../../data-source/collection-field/CollectionFieldProvider';
import { useRecord } from '../../record-provider';
import { useCompile } from '../../schema-component';
import { useCollection_deprecated } from './useCollection_deprecated';

/**
 * @deprecated use `useCollectionField` instead
 */
export const useCollectionField_deprecated = () => {
  const collection = useCollection_deprecated();
  const record = useRecord();
  const api = useAPIClient();
  const compile = useCompile();
  const ctx = useCollectionField();
  if (!ctx) {
    return {} as any;
  }
  const resourceName = `${ctx?.collectionName || collection?.name}.${ctx.name}`;
  const resource = api?.resource(resourceName, record[ctx.sourceKey]);
  return {
    ...ctx,
    uiSchema: compile(ctx.uiSchema),
    resource,
  };
};
