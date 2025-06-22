/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
// @ts-ignore
import {
  ExtendCollectionsProvider,
  SchemaComponent,
  SchemaComponentContext,
  useSchemaComponentContext,
} from '@nocobase/client';
import { lightComponentsCollection } from '../collections/lightComponents';
import { lightComponentsSchema } from '../schemas/lightComponents';
import {
  useCreateActionProps,
  useEditActionProps,
  useEditFormProps,
  useDeleteAction,
  useDuplicateAction,
  useBulkDestroyAction,
} from '../hooks';

export const LightComponentsManagement = () => {
  const scCtx = useSchemaComponentContext();

  return (
    <ExtendCollectionsProvider collections={[lightComponentsCollection]}>
      <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
        <SchemaComponent
          schema={lightComponentsSchema}
          scope={{
            useCreateActionProps,
            useEditActionProps,
            useEditFormProps,
            useDeleteAction,
            useDuplicateAction,
            useBulkDestroyAction,
          }}
        />
      </SchemaComponentContext.Provider>
    </ExtendCollectionsProvider>
  );
};
