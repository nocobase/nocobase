/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client-v2';
import { FlowModel, MultiRecordResource, type Collection } from '@nocobase/flow-engine';
import { Alert } from 'antd';
import React from 'react';
import { tExpr } from '../locale';
import { CommentItem } from './CommentItem';
import { CommentList } from './CommentList';

type CommentsBlockStructure = {
  subModels: {
    items: CommentItemModel[];
  };
};

export class CommentItemModel extends FlowModel {
  render() {
    return <CommentItem value={this.context.record} resource={this.context.blockModel.resource} model={this} />;
  }
}

export class CommentsBlockModel extends CollectionBlockModel<CommentsBlockStructure> {
  static scene: typeof BlockSceneEnum.oam = BlockSceneEnum.oam;

  static filterCollection(collection: Collection) {
    return collection.template === 'comment';
  }

  get resource() {
    return super.resource as MultiRecordResource;
  }

  createResource() {
    const resource = this.context.createResource(MultiRecordResource);
    resource.setPageSize(this.props.pageSize || 20);
    resource.addAppends('createdBy');
    return resource;
  }

  async handlePageChange(page: number) {
    this.resource.setPage(page);
    this.resource.loading = true;
    await this.refresh();
  }

  renderComponent() {
    const dataSource = this.resource.getData();

    if (this.collection.template !== 'comment') {
      return (
        <Alert
          message={this.context.t(
            'The current collection is not a comment collection, so the comment block cannot be used.',
            { ns: 'comments' },
          )}
          type="warning"
          showIcon
        />
      );
    }

    return (
      <CommentList
        dataSource={Array.isArray(dataSource) ? dataSource : []}
        resource={this.resource}
        handlePageChange={(page) => {
          this.handlePageChange(page);
        }}
      />
    );
  }
}

CommentsBlockModel.registerFlow({
  key: 'commentsSettings',
  title: tExpr('Comments settings'),
  on: 'beforeRender',
  sort: 150,
  steps: {
    pageSize: {
      title: tExpr('Page size'),
      uiSchema: {
        pageSize: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
            { label: '5', value: 5 },
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 },
            { label: '100', value: 100 },
            { label: '200', value: 200 },
          ],
        },
      },
      defaultParams: {
        pageSize: 20,
      },
      handler(ctx, params) {
        ctx.model.props.pageSize = params.pageSize;
        ctx.model.resource.loading = true;
        ctx.model.resource.setPage(1);
        ctx.model.resource.setPageSize(params.pageSize);
      },
    },
    dataScope: {
      use: 'dataScope',
    },
  },
});

CommentsBlockModel.define({
  label: tExpr('Comments'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'CommentsBlockModel',
    subModels: {
      items: [
        {
          use: 'CommentItemModel',
        },
      ],
    },
  },
  sort: 550,
});
