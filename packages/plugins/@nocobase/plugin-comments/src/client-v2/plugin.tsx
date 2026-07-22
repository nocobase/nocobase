/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import type { PluginDataSourceManagerClientV2 } from '@nocobase/plugin-data-source-manager/client-v2';
import { tExpr } from './locale';

export class PluginCommentClientV2 extends Plugin<any, Application> {
  async load() {
    this.flowEngine.registerModelLoaders({
      CommentsBlockModel: {
        loader: () => import('./models/CommentsBlockModel'),
      },
      CommentItemModel: {
        loader: () => import('./models/CommentsBlockModel'),
      },
      CommentActionGroupModel: {
        loader: () => import('./models/actions'),
      },
      EditCommentActionModel: {
        loader: () => import('./models/actions'),
      },
      DeleteCommentActionModel: {
        loader: () => import('./models/actions'),
      },
      QuoteReplyActionModel: {
        loader: () => import('./models/actions'),
      },
    });

    const dataSourceManager = (this.app.pm.get('@nocobase/plugin-data-source-manager') ||
      this.app.pm.get('data-source-manager')) as PluginDataSourceManagerClientV2 | undefined;

    dataSourceManager?.registerCollectionTemplate?.({
      name: 'comment',
      title: tExpr('Comment Collection'),
      order: 22,
      color: 'orange',
      creatable: false,
      collection: {
        options: {
          template: 'comment',
        },
        fields: [
          {
            name: 'content',
            type: 'text',
            length: 'long',
            interface: 'markdown',
            deletable: false,
            uiSchema: {
              type: 'string',
              title: tExpr('Comment Content'),
              interface: 'markdown',
              'x-component': 'MarkdownVditor',
            },
          },
        ],
      },
      presetFields: {
        disabled: true,
      },
    });
  }
}

export default PluginCommentClientV2;
