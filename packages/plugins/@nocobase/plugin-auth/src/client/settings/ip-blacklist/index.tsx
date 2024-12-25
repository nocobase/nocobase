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
  SchemaComponent,
  ExtendCollectionsProvider,
  useSchemaComponentContext,
  SchemaComponentContext,
} from '@nocobase/client';
import { Card } from 'antd';
import { hooksMap } from './hooks';
import ipBlacklistCollectionOptions from '../../../collection-options/ip-black-list';
import { tableSchema } from './schema';

export const IPBlackListSettings = () => {
  const scCtx = useSchemaComponentContext();
  return (
    <Card bordered={false}>
      <ExtendCollectionsProvider collections={[ipBlacklistCollectionOptions]}>
        <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
          <SchemaComponent schema={tableSchema} scope={hooksMap}></SchemaComponent>
        </SchemaComponentContext.Provider>
      </ExtendCollectionsProvider>
    </Card>
  );
};
