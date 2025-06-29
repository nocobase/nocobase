/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { tval } from '@nocobase/utils/client';
import { Card } from 'antd';
import React from 'react';
import { APIResource, BaseRecordResource, Collection, DefaultStructure, FlowModel } from '@nocobase/flow-engine';

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {}

BlockModel.registerFlow({
  key: 'blockProps',
  title: tval('Basic configuration'),
  auto: true,
  steps: {
    editBlockTitleAndDescription: {
      title: tval('Edit block title & description'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          title: tval('Title'),
        },
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          title: tval('Description'),
        },
      },
      handler(ctx, params) {
        const title = ctx.globals.flowEngine.translate(params.title);
        const description = ctx.globals.flowEngine.translate(params.description);
        ctx.model.setProps('title', title);
        ctx.model.setProps('description', description);
      },
    },
  },
});
export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {
  resource: APIResource;
  collection: Collection;

  onInit(options) {
    this.setSharedContext({
      currentBlockModel: this,
    });
  }

  addAppends(fieldPath: string, refresh = false) {
    const field = this.ctx.globals.dataSourceManager.getCollectionField(
      `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
    );
    if (!field) {
      return;
    }
    if (['belongsToMany', 'belongsTo', 'hasMany', 'hasOne'].includes(field.type)) {
      (this.resource as BaseRecordResource).addAppends(field.name);
      if (refresh) {
        this.resource.refresh();
      }
    }
  }
}

export class FilterBlockModel<T = DefaultStructure> extends BlockModel<T> {}
