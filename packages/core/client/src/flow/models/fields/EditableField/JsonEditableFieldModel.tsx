/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { largeField } from '@nocobase/flow-engine';
import { JsonInput } from '../../common/JsonInput';
import { FormFieldModel } from './FormFieldModel';
@largeField()
export class JsonEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['json'];

  get component() {
    return [
      JsonInput,
      {
        form: this.form,
      },
    ];
  }
}
