/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';

import { RecordCommentFieldSelect } from '../client-v2/models/components/RecordCommentFieldSelect';

export class PluginRecordCommentsClient extends Plugin {
  async load() {
    this.flowEngine.flowSettings.registerComponents({
      RecordCommentFieldSelect,
    });

    this.flowEngine.registerModelLoaders({
      RecordCommentsBlockModel: {
        loader: () => import('../client-v2/models/RecordCommentsBlockModel'),
      },
      RecordCommentItemModel: {
        loader: () => import('../client-v2/models/RecordCommentsBlockModel'),
      },
      RecordCommentActionGroupModel: {
        loader: () => import('../client-v2/models/actions'),
      },
      RecordCommentSubmitActionGroupModel: {
        loader: () => import('../client-v2/models/actions'),
      },
      RecordCommentSubmitActionModel: {
        loader: () => import('../client-v2/models/actions'),
      },
      EditRecordCommentActionModel: {
        loader: () => import('../client-v2/models/actions'),
      },
      DeleteRecordCommentActionModel: {
        loader: () => import('../client-v2/models/actions'),
      },
      QuoteReplyRecordCommentActionModel: {
        loader: () => import('../client-v2/models/actions'),
      },
    });
  }
}

export default PluginRecordCommentsClient;
