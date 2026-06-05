/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client';
import { MultiRecordResource } from '@nocobase/flow-engine';
import React from 'react';
import { tExpr } from '../locale';

export class CustomBlockAndFilterCollection extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  static filterCollection(collection) {
    return collection.name === 'users';
  }

  createResource() {
    return this.context.createResource(MultiRecordResource);
  }

  get resource() {
    return this.context.resource as MultiRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>
          This is a simple block rendered by <strong>CustomBlockAndFilterCollection</strong>.
        </p>
        <pre>{JSON.stringify(this.resource.getData(), null, 2)}</pre>
      </div>
    );
  }
}

CustomBlockAndFilterCollection.define({
  label: tExpr('Users collection only'),
});
