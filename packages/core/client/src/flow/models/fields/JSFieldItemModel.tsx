/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@nocobase/flow-engine';
import React from 'react';
import { CommonItemModel } from '../base/CommonItemModel';

export class JSFieldItemModel extends CommonItemModel {
  render() {
    return (
      <FormItem label={'JS field'}>
        <div>JS field</div>
      </FormItem>
    );
  }
}

JSFieldItemModel.define({
  label: 'JS field',
  sort: 9999,
});
