/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { DisplayItemModel } from '@nocobase/flow-engine';

import { MapReadPrettyFieldModel } from './MapReadPrettyFieldModel';

export class PointReadPrettyFieldModel extends MapReadPrettyFieldModel {
  static supportedFieldInterfaces = ['point'];
  getMapFieldType() {
    return 'point';
  }
}

DisplayItemModel.bindModelToInterface('PointReadPrettyFieldModel', ['point'], { isDefault: true });
