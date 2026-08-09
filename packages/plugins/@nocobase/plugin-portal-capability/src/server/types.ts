/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';

export type PortalDataAction = 'query' | 'get' | 'create' | 'update' | 'destroy' | 'aggregate';

export type TargetResourceAction = 'list' | 'get' | 'create' | 'update' | 'destroy' | 'query';

export interface PortalDataRequestContext {
  ctx?: Context;
}

export interface PortalDataBaseInput {
  collection?: string;
  resource?: string;
  filter?: Record<string, unknown>;
  filterByTk?: unknown;
  fields?: string[];
  appends?: string[];
  except?: string[];
  sort?: string[];
  page?: number | string;
  pageSize?: number | string;
  paginate?: boolean | string;
  targetCollection?: string;
}

export type PortalDataQueryInput = PortalDataBaseInput;

export type PortalDataGetInput = PortalDataBaseInput;

export interface PortalDataCreateInput extends PortalDataBaseInput {
  values?: Record<string, unknown>;
  whitelist?: string[];
  blacklist?: string[];
  updateAssociationValues?: string[];
}

export interface PortalDataUpdateInput extends PortalDataCreateInput {
  forceUpdate?: boolean;
}

export type PortalDataDestroyInput = PortalDataBaseInput;

export interface PortalDataAggregateInput extends PortalDataBaseInput {
  measures?: unknown[];
  dimensions?: unknown[];
  orders?: unknown[];
  having?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  timezone?: string;
}

export interface PortalDataMetadataInput {
  collection?: string;
  resource?: string;
}

export interface PortalDataQueryResult {
  rows: unknown[];
  count?: number;
  page?: number;
  pageSize?: number;
  totalPage?: number;
  hasNext?: boolean;
}

export interface PortalDataDeleteResult {
  success: true;
}

export interface PortalDataCapabilities {
  data: {
    actions: PortalDataAction[];
    rawSql: false;
    permissionAware: true;
  };
}
