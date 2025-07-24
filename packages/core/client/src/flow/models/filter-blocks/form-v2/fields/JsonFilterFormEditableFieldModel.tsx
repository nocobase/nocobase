/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonInput } from '../../../common/JsonInput';
import { FilterFormEditableFieldModel } from './FilterFormEditableFieldModel';

export class JsonFilterFormEditableFieldModel extends FilterFormEditableFieldModel {
  static readonly supportedFieldInterfaces = ['json'];

  get component() {
    return [JsonInput, {}];
  }
}
