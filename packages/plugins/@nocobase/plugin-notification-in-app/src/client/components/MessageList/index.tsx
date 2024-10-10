/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { messagelistSchema } from './schema';
import { ExtendCollectionsProvider, SchemaComponent } from '@nocobase/client';
import { messageCollection } from '../../../types/messages';
export const MessageList = () => {
  return (
    <ExtendCollectionsProvider collections={[messageCollection]}>
      <SchemaComponent schema={messagelistSchema} />
    </ExtendCollectionsProvider>
  );
};
