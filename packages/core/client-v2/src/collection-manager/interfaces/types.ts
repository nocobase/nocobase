/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';

import type { FieldFilterable, FieldFilterOperator } from '../filter-operators';

interface IDefault {
  type: string;
  uiSchema?: ISchema;
  [key: string]: any;
}

export interface IField extends ISchema {
  group?: string;
  order?: number;
  default?: IDefault;
  operators?: FieldFilterOperator[];
  /**
   * - 如果该值为空，则在 Filter 组件中该字段会被过滤掉
   * - 如果该值为空，则不会在变量列表中看到该字段
   */
  filterable?: FieldFilterable;
  // NOTE: set to `true` means field could be used as a title field
  titleUsable?: boolean;
  [key: string]: any;
}
