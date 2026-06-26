/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

import { RecordCommentFieldSelect } from './models/components/RecordCommentFieldSelect';

export class PluginRecordCommentsClientV2 extends Plugin {
  async load() {
    this.flowEngine.flowSettings.registerComponents({
      RecordCommentFieldSelect,
    });

    this.flowEngine.registerModelLoaders({
      RecordCommentsBlockModel: {
        loader: () => import('./models/RecordCommentsBlockModel'),
      },
      RecordCommentItemModel: {
        loader: () => import('./models/RecordCommentsBlockModel'),
      },
      RecordCommentActionGroupModel: {
        loader: () => import('./models/actions'),
      },
      RecordCommentSubmitActionGroupModel: {
        loader: () => import('./models/actions'),
      },
      EditRecordCommentActionModel: {
        loader: () => import('./models/actions'),
      },
      DeleteRecordCommentActionModel: {
        loader: () => import('./models/actions'),
      },
      QuoteReplyRecordCommentActionModel: {
        loader: () => import('./models/actions'),
      },
    });
  }
}

export default PluginRecordCommentsClientV2;
