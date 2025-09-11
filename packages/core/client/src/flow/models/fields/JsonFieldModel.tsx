/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
import { JsonInput } from '../../components';
import { FormFieldModel } from './FormFieldModel';

@largeField()
export class JsonFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['json'];

  get component() {
    return [JsonInput, {}];
  }
}

EditableItemModel.bindModelToInterface('JsonFieldModel', ['json'], {
  isDefault: true,
});
