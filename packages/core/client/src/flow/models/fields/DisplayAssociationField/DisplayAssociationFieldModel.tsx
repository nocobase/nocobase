/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { updateOpenViewStepParams } from '../../../flows/openViewFlow';
import { FieldModel } from '../../base';

export class DisplayAssociationFieldModel extends FieldModel {
  public static readonly supportedFieldInterfaces = null;

  onInit(options) {
    super.onInit(options);

    const sourceCollection = this.context.blockModel?.collection;
    const targetCollection = this.context.collectionField?.targetCollection;

    updateOpenViewStepParams(
      {
        collectionName: targetCollection?.name,
        associationName:
          sourceCollection?.name && this.context.collectionField?.name
            ? `${sourceCollection.name}.${this.context.collectionField.name}`
            : undefined,
        dataSourceKey: targetCollection?.dataSourceKey,
      },
      this,
    );
  }
}
