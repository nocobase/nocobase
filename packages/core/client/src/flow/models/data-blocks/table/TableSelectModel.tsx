/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@nocobase/flow-engine';
import { TableModel } from './TableModel';

export class TableSelectModel extends TableModel {
  static scene = 'select';
  rowSelectionProps = observable.deep({});
  onInit(options: any) {
    super.onInit(options);
    Object.assign(this.rowSelectionProps, this.context.view.inputArgs.rowSelectionProps || {});
    console.log('inputArgs', this.context.view.inputArgs);
  }
}

TableSelectModel.define({
  label: 'Table',
  children: false,
});
