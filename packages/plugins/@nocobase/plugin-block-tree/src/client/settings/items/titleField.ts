/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SelectProps, createSelectSchemaSettingsItem, useCollection, useCompile } from "@nocobase/client";
import { useCollectionKey } from "../../schema";
import { generateCommonTemplate } from "../../locale";

function useOptions(): SelectProps['options'] {
  const collection = useCollection();

  const compile = useCompile();
  return collection
    .getFields((field) => collection.isTitleField(field))
    .map(field => ({ label: field.uiSchema?.title ? compile(field.uiSchema.title) : field.name, value: field.name }));
}

export const titleFieldSchemaSettingsItem = createSelectSchemaSettingsItem({
  name: 'titleField',
  title: generateCommonTemplate('Title field'),
  useOptions,
  schemaKey: 'x-decorator-props.tree.fieldNames.title',
  useDefaultValue: useCollectionKey,
});
