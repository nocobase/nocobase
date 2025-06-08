/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useMemo } from 'react';
import {
  BlockTemplateProvider,
  CollectionDeletedPlaceholder,
  RemoteSchemaComponent,
  useDesignable,
  useMobileLayout,
} from '..';
import { useTemplateBlockContext } from '../block-provider/TemplateBlockProvider';
import { useSchemaTemplateManager } from './SchemaTemplateManagerProvider';
import { transformMultiColumnToSingleColumn } from '@nocobase/utils/client';

export const BlockTemplate = observer(
  (props: any) => {
    const { templateId } = props;
    const { getTemplateById } = useSchemaTemplateManager();
    const field = useField();
    const fieldSchema = useFieldSchema();
    const { dn } = useDesignable();
    const template = useMemo(() => getTemplateById(templateId), [templateId]);
    const { onTemplateSuccess } = useTemplateBlockContext();
    const { isMobileLayout } = useMobileLayout();

    const onSuccess = (data) => {
      fieldSchema['x-linkage-rules'] = data?.data?.['x-linkage-rules'] || [];
      fieldSchema.setProperties(data?.data?.properties);
      onTemplateSuccess?.();
    };
    return template ? (
      <BlockTemplateProvider {...{ dn, field, fieldSchema, template }}>
        <RemoteSchemaComponent
          noForm
          uid={template?.uid}
          onSuccess={onSuccess}
          schemaTransform={isMobileLayout ? transformMultiColumnToSingleColumn : undefined}
        />
      </BlockTemplateProvider>
    ) : (
      <CollectionDeletedPlaceholder type="Block template" name={templateId} />
    );
  },
  { displayName: 'BlockTemplate' },
);
