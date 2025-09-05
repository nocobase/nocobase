/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { updateOpenViewStepParams } from '../../../../flows/openViewFlow';
import { ReadPrettyFieldModel } from '../ReadPrettyFieldModel';

export class ReadPrettyAssociationFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = null;

  onInit(options) {
    super.onInit(options);

    const sourceCollection = this.context.blockModel?.collection;
    const targetCollection = this.collectionField?.targetCollection;

    updateOpenViewStepParams(
      {
        collectionName: targetCollection?.name,
        associationName:
          sourceCollection?.name && this.collectionField?.name
            ? `${sourceCollection.name}.${this.collectionField.name}`
            : undefined,
        dataSourceKey: targetCollection?.dataSourceKey,
      },
      this,
    );
  }
}
