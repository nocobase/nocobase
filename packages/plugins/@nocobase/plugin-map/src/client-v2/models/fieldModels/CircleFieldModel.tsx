/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { EditableItemModel } from '@nocobase/flow-engine';
import { MapFieldModel } from './MapFieldModel';

export class CircleFieldModel extends MapFieldModel {
  getMapFieldType() {
    return 'circle';
  }
}

EditableItemModel.bindModelToInterface('CircleFieldModel', ['circle'], { isDefault: true });
