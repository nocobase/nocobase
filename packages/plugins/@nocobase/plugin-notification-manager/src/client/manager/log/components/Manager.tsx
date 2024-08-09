/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Card } from 'antd';
import { messageLogsManagerSchema } from '../schemas';
import { SchemaComponent, SchemaComponentContext, useSchemaComponentContext } from '@nocobase/client';
import { ExtendCollectionsProvider } from '@nocobase/client';
import { useNotificationTranslation } from '../../../locale';
import messageLogCollection from '../../../../collections/messageLog';
import channelCollection from '../../../../collections/channel';

export const LogManager = () => {
  const { t } = useNotificationTranslation();
  const scCtx = useSchemaComponentContext();
  return (
    <ExtendCollectionsProvider collections={[messageLogCollection, channelCollection]}>
      <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
        <Card bordered={false}>
          <SchemaComponent schema={messageLogsManagerSchema} scope={{ t }} />
        </Card>
      </SchemaComponentContext.Provider>
    </ExtendCollectionsProvider>
  );
};

LogManager.displayName = 'LogManager';
