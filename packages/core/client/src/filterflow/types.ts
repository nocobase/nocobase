/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import { ComponentProps } from 'react';

// Filter System Types
export type FilterHandlerContext = { props?: ComponentProps<any>; payload?: any };
export type FilterHandler = (
  currentValue: any,
  params?: Record<string, any>,
  context?: FilterHandlerContext,
) => any | Promise<any>;
export interface IFilter {
  name: string;
  title: string;
  description?: string;
  group?: string;
  sort?: number;
  uiSchema: Record<string, ISchema>;
  handler: FilterHandler;
}
export interface FilterGroupOptions {
  name: string;
  title: string;
  sort?: number;
}
export interface FilterFlowStepOptions {
  key?: string;
  filterName: string;
  title?: string;
  params?: Record<string, any>;
  condition?: string;
}
export interface FilterFlowOptions {
  name: string;
  title: string;
  steps: FilterFlowStepOptions[];
}
