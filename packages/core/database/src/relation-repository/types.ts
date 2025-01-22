/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AssociationKeysToBeUpdate, BlackList, Values, WhiteList } from '@nocobase/database';
import { Transaction } from 'sequelize';
import {
  CreateOptions as SequelizeCreateOptions,
  UpdateOptions as SequelizeUpdateOptions,
} from 'sequelize/types/model';

export type TargetKey = string | number | { [key: string]: any };

export interface Filter {
  [key: string]: any;
}

export interface Appends {
  [key: string]: true | Appends;
}

export interface Except {
  [key: string]: true | Except;
}

export interface CommonOptions {
  transaction?: Transaction;
  context?: any;
}

export interface FindOptions extends CommonOptions {
  filter?: Filter;
  filterByTk?: TargetKey;
  fields?: string[];
  appends?: string[];
  except?: string[];
  sort?: string[];
  limit?: number;
  offset?: number;
  raw?: boolean;
  targetCollection?: string;
}

export interface CountOptions extends CommonOptions {
  filter?: Filter;
}

export interface CreateOptions extends SequelizeCreateOptions {
  values?: Values | Values[];
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  context?: any;
}

export interface UpdateOptions extends Omit<SequelizeUpdateOptions, 'where'> {
  values: Values;
  filter?: Filter;
  filterByTk?: TargetKey;
  whitelist?: WhiteList;
  blacklist?: BlackList;
  updateAssociationValues?: AssociationKeysToBeUpdate;
  targetCollection?: string;
  context?: any;
}

export interface DestroyOptions extends CommonOptions {
  filter?: Filter;
  filterByTk?: TargetKey;
  truncate?: boolean;
  context?: any;
}

export interface FirstOrCreateOptions extends CommonOptions {
  filterKeys: string[];
  values: any;
  hooks?: boolean;
  context?: any;
}

export interface ThroughValues {
  [key: string]: any;
}

export interface AssociatedOptions extends CommonOptions {
  tk?: TargetKey | TargetKey[];
  transaction?: Transaction;
}

export interface PrimaryKeyWithThroughValues {
  pk: any;
  throughValues?: ThroughValues;
}

export interface ToggleOptions extends CommonOptions {
  tk?: TargetKey;
  transaction?: Transaction;
}
