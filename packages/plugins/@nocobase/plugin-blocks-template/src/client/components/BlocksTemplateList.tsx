/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ExtendCollectionsProvider,
  SchemaComponent,
  SchemaComponentContext,
  useSchemaComponentContext,
} from '@nocobase/client';
import React from 'react';
import { blocksTemplatesCollection } from '../collections/blocksTemplates';
import { blocksTemplatesSchema } from '../schemas/blockTemplates';
import { useSubmitActionProps } from '../../hooks/useSubmitActionProps';
import { useEditFormProps } from '../../hooks/useEditFormProps';
import { useDeleteActionProps } from '../../hooks/useDeleteActionProps';

export const BlocksTemplateList = () => {
  const scCtx = useSchemaComponentContext();
  return (
    <ExtendCollectionsProvider collections={[blocksTemplatesCollection]}>
      <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
        <SchemaComponent
          schema={blocksTemplatesSchema}
          scope={{ useSubmitActionProps, useEditFormProps, useDeleteActionProps }}
        />
      </SchemaComponentContext.Provider>
    </ExtendCollectionsProvider>
  );
};
