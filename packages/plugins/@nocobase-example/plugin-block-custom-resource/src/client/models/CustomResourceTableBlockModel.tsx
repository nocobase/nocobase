/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from '@nocobase/client';
import { SingleRecordResource } from '@nocobase/flow-engine';
import React from 'react';

export class CustomBlockWithResourceModel extends BlockModel {
  createResource() {
    const resource = this.context.createResource(SingleRecordResource);
    return resource;
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('resource', {
      get: () => {
        const resource = this.createResource();
        return resource;
      },
    });
  }

  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>
          This is a simple block rendered by <strong>CustomResourceTableBlockModel</strong>.
        </p>
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

CustomBlockWithResourceModel.registerFlow({
  key: 'flow1',
  steps: {
    initResource: {
      handler: async (ctx) => {
        const resource = ctx.resource as SingleRecordResource;
        resource.setResourceName(ctx.view.inputArgs.collectionName);
        resource.setFilterByTk(ctx.view.inputArgs.filterByTk);
      },
    },
    refresh: {
      handler: async (ctx) => {
        const resource = ctx.resource as SingleRecordResource;
        await resource.refresh();
      },
    },
  },
});
