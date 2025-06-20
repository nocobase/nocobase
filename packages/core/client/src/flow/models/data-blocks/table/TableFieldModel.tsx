/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { CollectionField } from '@nocobase/flow-engine';
import { Popover } from 'antd';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';

class Field {
  resource;
  index: number;
  path: string;

  constructor(resource, index, path) {
    this.resource = resource;
    this.index = index;
    this.path = path;
  }

  get value() {
    return this.resource.getCell(this.index, this.path);
  }
}

export class TableFieldModel extends FieldModel {
  field: Field;
  public render() {
    return <div>{this.field.value}</div>;
  }
}

TableFieldModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx, params) {
        const collectionField = ctx.globals.dataSourceManager.getCollectionField(params.fieldPath) as CollectionField;
        ctx.model.collectionField = collectionField;
        ctx.model.fieldPath = params.fieldPath;
        ctx.model.field = new Field(
          ctx.shared.currentBlockModel.resource,
          ctx.extra.index,
          params.fieldPath.split('.').pop(),
        );
      },
    },
  },
});
