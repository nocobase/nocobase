/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type ValueType = 'date' | 'string' | 'dateRange' | 'any';
export type Helper = {
  name: string;
  title: string;
  handler: Function;
  group: string;
  inputType: ValueType;
  outputType: ValueType;
  sort: number;
  args: string[];
  uiSchema?: any[];
};
