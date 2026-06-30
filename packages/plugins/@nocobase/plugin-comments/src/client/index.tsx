/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Plugin } from '@nocobase/client';
import { CommentCollectionTemplate } from './collection-templates/comment';
import { Comment } from './comment';
import { commentBlockSettings } from './comment/Comment.Settings';
import { useCommentBlockDecoratorProps } from './hooks/useCommentBlockDecoratorProps';
import {
  commentItemActionInitializers,
  QuoteReplyCommentActionButton,
  QuoteReplyCommentActionInitializer,
  UpdateCommentActionButton,
  UpdateCommentActionInitializer,
} from './schema-initializer/items';
import { CommentsBlockModel, CommentItemModel } from './models/CommentsBlockModel';
import * as actions from './models/actions';
export class PluginCommentClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.dataSourceManager.addCollectionTemplates([CommentCollectionTemplate]);
    this.app.addComponents({
      Comment,
      UpdateCommentActionInitializer,
      UpdateCommentActionButton,
      QuoteReplyCommentActionButton,
      QuoteReplyCommentActionInitializer,
    });

    this.app.addScopes({ useCommentBlockDecoratorProps });

    this.schemaSettingsManager.add(commentBlockSettings);

    this.schemaInitializerManager.add(commentItemActionInitializers);

    this.flowEngine.registerModels({
      CommentsBlockModel,
      CommentItemModel,
      ...actions,
    });
  }
}

export default PluginCommentClient;
