/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface FieldDataType {
  key: React.Key;
  title: string;
  name: string;
  interface?: string;
  description?: string;
  enum?: { label: string; value: string }[];
  [key: string]: any; // Allow additional properties
}

export interface CollectionDataType {
  key: React.Key;
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
}
