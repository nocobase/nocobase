/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TableBlockModel } from '@nocobase/client';
import { MultiRecordResource } from '@nocobase/flow-engine';

export class CustomResourceTableBlockModel extends TableBlockModel {
  createResource() {
    const resource = this.context.createResource(MultiRecordResource);
    return resource;
  }
}
