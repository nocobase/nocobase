/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useMemo } from 'react';
import { CollectionDeletedPlaceholder, RemoteSchemaComponent, useDesignable } from '..';
import { useSchemaTemplateManager } from './SchemaTemplateManagerProvider';
import { useTemplateBlockContext } from '../block-provider/TemplateBlockProvider';

const BlockTemplateContext = createContext<any>({});
BlockTemplateContext.displayName = 'BlockTemplateContext';

export const useBlockTemplateContext = () => {
  return useContext(BlockTemplateContext);
};

export const BlockTemplate = observer(
  (props: any) => {
    const { templateId } = props;
    const { getTemplateById } = useSchemaTemplateManager();
    const field = useField();
    const fieldSchema = useFieldSchema();
    const { dn } = useDesignable();
    const template = useMemo(() => getTemplateById(templateId), [templateId]);
    const { onTemplateSuccess } = useTemplateBlockContext();

    const onSuccess = (data) => {
      fieldSchema['x-linkage-rules'] = data?.data?.['x-linkage-rules'] || [];
      fieldSchema.setProperties(data?.data?.properties);
      onTemplateSuccess?.();
    };
    return template ? (
      <BlockTemplateContext.Provider value={{ dn, field, fieldSchema, template }}>
        <RemoteSchemaComponent noForm uid={template?.uid} onSuccess={onSuccess} />
      </BlockTemplateContext.Provider>
    ) : (
      <CollectionDeletedPlaceholder type="Block template" name={templateId} />
    );
  },
  { displayName: 'BlockTemplate' },
);
