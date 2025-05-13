/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import { BaseModel } from '@nocobase/client';

// Filter System Types
export type FilterHandlerContext<T = any> = {
  payload?: T;
  meta?: {
    flowKey?: string;
    flowName?: string;
    params?: FilterStepParams;
  };
};

export type FilterStepParams = Record<string, Record<string, any>>;

export type FilterHandler<M extends BaseModel = BaseModel, CtxPayload = any> = (
  model: M,
  params: any,
  context: FilterHandlerContext<CtxPayload>,
) => void | Promise<void>;

export interface IFilter<M extends BaseModel = BaseModel> {
  name: string;
  title: string;
  description?: string;
  group?: string;
  sort?: number;
  uiSchema: Record<string, ISchema>;
  handler: FilterHandler<M>;
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
  condition?: string;
}

export interface FilterFlowOptions {
  key: string;
  title: string;
  steps: FilterFlowStepOptions[];
}
