/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollectionManager_deprecated, useCompile } from '@nocobase/client';
import { buildImportFieldOptions } from './buildImportFieldOptions';

export const useFields = (collectionName: string) => {
  const { getCollectionFields } = useCollectionManager_deprecated();
  const fields = getCollectionFields(collectionName);
  const compile = useCompile();

  return buildImportFieldOptions(
    fields,
    (field) => compile(field?.uiSchema?.title) || field.name,
    (field) => getCollectionFields(field.target),
  );
};
