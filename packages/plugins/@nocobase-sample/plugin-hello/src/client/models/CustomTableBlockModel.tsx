/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, CollectionActionModel, TableBlockModel } from '@nocobase/client';
import { buildSubModelItems, FlowModelContext, MultiRecordResource } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';

export class CustomTableBlockModel extends TableBlockModel {
  subModelBaseClasses = {
    collectionAction: [CustomActionModel],
    recordAction: [CustomActionModel],
  };

  createResource() {
    const resource = this.context.createResource(MultiRecordResource);
    resource.setRefreshAction('list');
    return resource;
  }
}

export class CustomActionModel extends ActionModel {}

export class HelloCustomActionModel extends CustomActionModel {
  defaultProps: ButtonProps = {
    title: 'Hello Custom Action',
  };
}

export class CustomCollectionActionModel extends CollectionActionModel {
  static async defineChildren(ctx: FlowModelContext) {
    const children1 = await super.defineChildren(ctx);
    const children2 = await buildSubModelItems(CustomActionModel)(ctx);
    return [...children1, ...children2];
  }
}

CustomTableBlockModel.define({
  hide: true,
  // children: false,
  createModelOptions(ctx, extra) {
    return {
      use: 'CustomTableBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
        },
      },
    };
  },
});
