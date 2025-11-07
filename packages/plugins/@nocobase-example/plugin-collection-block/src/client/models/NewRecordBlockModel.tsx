/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockSceneEnum, CollectionBlockModel } from '@nocobase/client';
import { SingleRecordResource } from '@nocobase/flow-engine';
import React from 'react';
import { tExpr } from '../locale';

export class NewRecordBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.new;

  createResource() {
    const resource = this.context.createResource(SingleRecordResource);
    resource.isNewRecord = true;
    return resource;
  }

  get resource() {
    return this.context.resource as SingleRecordResource;
  }

  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>
          This is a simple block rendered by <strong>NewRecordBlockModel</strong>.
        </p>
      </div>
    );
  }
}

NewRecordBlockModel.define({
  label: tExpr('New record'),
});
