/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type React from 'react';

export interface FieldDataType {
  key?: React.Key;
  title: string;
  name: string;
  interface?: string;
  type?: string;
  description?: string;
  enum?: { label: string; value: string }[];
  target?: string;
  targetKey?: string;
  sourceKey?: string;
  foreignKey?: string;
  otherKey?: string;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  uiSchema?: Record<string, unknown>;
  hidden?: boolean;
  [key: string]: unknown;
}

export interface CollectionDataType {
  key?: React.Key;
  title: string;
  name: string;
  fields: FieldDataType[];
  template?: string;
  autoGenId?: boolean;
  createdAt?: boolean;
  updatedAt?: boolean;
  createdBy?: boolean;
  updatedBy?: boolean;
  description?: string;
  hidden?: boolean;
  [key: string]: unknown;
}

export type DataModelingArgs = {
  collections?: CollectionDataType[] | string;
  [key: string]: unknown;
};

export type DataModelingToolCall = {
  id: string;
  name: string;
  invokeStatus?: string;
  status?: string;
  args: DataModelingArgs;
};
