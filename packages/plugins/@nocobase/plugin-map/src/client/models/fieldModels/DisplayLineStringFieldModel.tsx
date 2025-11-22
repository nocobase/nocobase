/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DisplayItemModel } from '@nocobase/flow-engine';
import { DisplayMapFieldModel } from './DisplayMapFieldModel';

export class DisplayLineStringFieldModel extends DisplayMapFieldModel {
  getMapFieldType() {
    return 'lineString';
  }
}

DisplayItemModel.bindModelToInterface('DisplayLineStringFieldModel', ['lineString'], { isDefault: true });
