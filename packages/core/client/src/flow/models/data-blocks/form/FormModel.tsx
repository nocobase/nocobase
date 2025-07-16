/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm, Form } from '@formily/core';
import { DataBlockModel } from '../../base/BlockModel';
import { BlockGridModel } from '../../base/GridModel';
import { FormActionModel } from './FormActionModel';
import { FormFieldGridModel } from './FormFieldGridModel';

export class FormModel extends DataBlockModel<{
  parent?: BlockGridModel;
  subModels?: { grid: FormFieldGridModel; actions?: FormActionModel[] };
}> {
  get form() {
    return this.context.form as Form;
  }

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('form', {
      get: () => createForm(),
    });
    this.context.defineProperty('record', {
      get: () => this.getCurrentRecord(),
      cache: false,
    });
  }

  getCurrentRecord() {
    return {};
  }

  renderComponent() {
    throw new Error('renderComponent method must be implemented in subclasses of FormModel');
  }
}

FormModel.define({
  hide: true,
});
