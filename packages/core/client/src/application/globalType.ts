/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema as FormilySchema } from '@formily/json-schema';

export interface ISchema extends FormilySchema {
  'x-use-component-props'?: string | Function;
  'x-use-decorator-props'?: string;
}
