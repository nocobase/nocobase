/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ReadPrettyFieldModel } from '../ReadPrettyFieldModel';

export class AssociationReadPrettyFieldModel extends ReadPrettyFieldModel {
  targetCollection;
}

AssociationReadPrettyFieldModel.registerFlow({
  key: 'AssociationReadPrettyFieldDefault',
  auto: true,
  sort: 150,
  steps: {
    step1: {
      handler(ctx, params) {
        const { collectionField } = ctx.model;
        const { target } = collectionField?.options || {};
        const collectionManager = collectionField.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
        ctx.model.targetCollection = targetCollection;
      },
    },
  },
});
