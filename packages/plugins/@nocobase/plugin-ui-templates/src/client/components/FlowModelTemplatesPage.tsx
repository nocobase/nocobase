/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import {
  ExtendCollectionsProvider,
  SchemaComponent,
  SchemaComponentContext,
  useSchemaComponentContext,
} from '@nocobase/client';
import { createFlowModelTemplatesSchema } from '../schemas/flowModelTemplates';
import {
  useFlowModelTemplateDeleteActionProps,
  useFlowModelTemplateEditActionProps,
  useFlowModelTemplateEditFormProps,
  useFlowModelTemplateSearchProps,
} from '../hooks/useFlowModelTemplateActions';
import { flowModelTemplatesCollection } from '../collections/flowModelTemplates';

const TemplateTable: React.FC<{ filter?: Record<string, any> }> = ({ filter }) => {
  const scCtx = useSchemaComponentContext();
  const schema = useMemo(() => createFlowModelTemplatesSchema(filter), [filter]);

  return (
    <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
      <SchemaComponent
        schema={schema}
        scope={{
          useFlowModelTemplateSearchProps,
          useFlowModelTemplateEditFormProps,
          useFlowModelTemplateEditActionProps,
          useFlowModelTemplateDeleteActionProps,
        }}
      />
    </SchemaComponentContext.Provider>
  );
};

// 区块模板页面: type 不是 popup 的（包括 null 和空）
export const BlockTemplatesPage: React.FC = () => {
  const blockTemplateFilter = useMemo(
    () => ({
      $or: [{ type: { $ne: 'popup' } }, { type: { $empty: true } }],
    }),
    [],
  );

  return (
    <ExtendCollectionsProvider collections={[flowModelTemplatesCollection]}>
      <TemplateTable filter={blockTemplateFilter} />
    </ExtendCollectionsProvider>
  );
};

// 弹窗模板页面: type 是 popup 的
export const PopupTemplatesPage: React.FC = () => {
  const popupTemplateFilter = useMemo(
    () => ({
      type: 'popup',
    }),
    [],
  );

  return (
    <ExtendCollectionsProvider collections={[flowModelTemplatesCollection]}>
      <TemplateTable filter={popupTemplateFilter} />
    </ExtendCollectionsProvider>
  );
};

// 保留原来的导出以兼容
export const FlowModelTemplatesPage = BlockTemplatesPage;
