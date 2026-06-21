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

import { canMakeAssociationBlock, Plugin, useCollection, useCollectionManager } from '@nocobase/client';
import { useMemo } from 'react';
import { CommentCollectionTemplate } from './collection-templates/comment';
import { Comment } from './comment';
import { commentBlockSettings } from './comment/Comment.Settings';
import { useCommentBlockDecoratorProps } from './hooks/useCommentBlockDecoratorProps';
import { generateNTemplate } from './locale';
import { CommentBlockInitializer } from './schema-initializer/initializers';
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
    this.app.schemaInitializerManager.addItem('page:addBlock', 'dataBlocks.comment', {
      title: generateNTemplate('Comment'),
      Component: 'CommentBlockInitializer',
      useComponentProps() {
        return {
          filterCollections({ collection }) {
            return collection.template === 'comment';
          },
        };
      },
    });

    this.app.schemaInitializerManager.addItem('popup:common:addBlock', 'dataBlocks.comment', {
      title: generateNTemplate('Comment'),
      Component: 'CommentBlockInitializer',
      useVisible() {
        const collection = useCollection();
        return useMemo(
          () =>
            collection.fields.some(
              (field) => canMakeAssociationBlock(field) && ['hasMany', 'belongsToMany'].includes(field.type),
            ),
          [collection.fields],
        );
      },
      useComponentProps() {
        const cm = useCollectionManager();
        return {
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              if (!['hasMany', 'belongsToMany'].includes(associationField.type)) {
                return false;
              }
              const collection = cm.getCollection(associationField.target);
              return collection?.template === 'comment';
            }
            return false;
          },
          filterOtherRecordsCollection(collection) {
            return collection?.template === 'comment';
          },
          showAssociationFields: true,
          hideOtherRecordsInPopup: false,
          hideSearch: true,
        };
      },
    });

    this.app.addComponents({
      CommentBlockInitializer: CommentBlockInitializer as any,
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
