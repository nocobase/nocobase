/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FieldModel } from '../../../base/FieldModel';
import { FormFieldGridModel } from '../FormFieldGridModel';
import { FieldModelRenderer } from '../../../../common/FieldModelRenderer';
import { FormItem } from './FormItem';

export class FormItemModel extends FieldModel<{
  parent: FormFieldGridModel;
  subModels: { field: FieldModel };
}> {
  setProps(props) {
    Object.assign(this.props, props);
  }

  onInit(options: any): void {
    super.onInit(options);
  }

  renderContent() {
    const fieldModel = this.subModels.field as FieldModel;
    return (
      <FormItem {...this.props}>
        <FieldModelRenderer model={fieldModel} />
      </FormItem>
    );
  }
}
