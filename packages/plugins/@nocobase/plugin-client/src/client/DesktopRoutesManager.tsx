/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-disable react-hooks/rules-of-hooks */
import {
  ExtendCollectionsProvider,
  ISchema,
  SchemaComponent,
  SchemaComponentContext,
  useSchemaComponentContext,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { FC, useMemo } from 'react';
import desktopRoutes from '../collections/desktopRoutes';
import { useRoutesTranslation } from './locale';
import { createRoutesTableSchema } from './routesTableSchema';

const routesSchema: ISchema = createRoutesTableSchema('desktopRoutes', '/admin');

export const DesktopRoutesManager: FC = () => {
  const { t } = useRoutesTranslation();
  const scCtx = useSchemaComponentContext();
  const schemaComponentContext = useMemo(() => ({ ...scCtx, designable: false }), [scCtx]);

  return (
    <ExtendCollectionsProvider collections={[desktopRoutes]}>
      <SchemaComponentContext.Provider value={schemaComponentContext}>
        <Card bordered={false}>
          <SchemaComponent
            schema={routesSchema}
            scope={{
              t,
            }}
          />
        </Card>
      </SchemaComponentContext.Provider>
    </ExtendCollectionsProvider>
  );
};
