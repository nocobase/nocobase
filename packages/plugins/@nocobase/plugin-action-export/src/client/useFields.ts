/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useCollectionManager_deprecated, useCompile } from '@nocobase/client';
import { buildExportFieldOptions } from './buildExportFieldOptions';

export const useFields = (collectionName: string) => {
  const fieldSchema = useFieldSchema();
  const nonfilterable = fieldSchema?.['x-component-props']?.nonfilterable || [];
  const { getCollectionFields } = useCollectionManager_deprecated();
  const fields = getCollectionFields(collectionName);
  const compile = useCompile();

  return buildExportFieldOptions(
    fields,
    (field) => compile(field?.uiSchema?.title) || field.name,
    (field) => getCollectionFields(field.target),
  );
};
