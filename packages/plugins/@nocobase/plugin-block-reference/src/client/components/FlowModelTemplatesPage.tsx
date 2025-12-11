/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  ExtendCollectionsProvider,
  SchemaComponent,
  SchemaComponentContext,
  useSchemaComponentContext,
} from '@nocobase/client';
import { flowModelTemplatesSchema } from '../schemas/flowModelTemplates';
import {
  useFlowModelTemplateDeleteActionProps,
  useFlowModelTemplateEditActionProps,
  useFlowModelTemplateEditFormProps,
  useFlowModelTemplateSearchProps,
} from '../hooks/useFlowModelTemplateActions';
import { flowModelTemplatesCollection } from '../collections/flowModelTemplates';

export const FlowModelTemplatesPage: React.FC = () => {
  const scCtx = useSchemaComponentContext();

  return (
    <ExtendCollectionsProvider collections={[flowModelTemplatesCollection]}>
      <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
        <SchemaComponent
          schema={flowModelTemplatesSchema}
          scope={{
            useFlowModelTemplateSearchProps,
            useFlowModelTemplateEditFormProps,
            useFlowModelTemplateEditActionProps,
            useFlowModelTemplateDeleteActionProps,
          }}
        />
      </SchemaComponentContext.Provider>
    </ExtendCollectionsProvider>
  );
};
