/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateFormModel, FieldModel, InputFieldModel } from '@nocobase/client';
import React from 'react';

export class BulkEditFormModel extends CreateFormModel {
  customModelClasses = {
    FormActionGroupModel: 'BulkEditFormActionGroupModel',
    // FormItemModel: 'FormItemModel',
    // FormCustomItemModel: 'FormCustomItemModel',
  };
}
