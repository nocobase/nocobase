/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TargetKey, Values } from '../repository';
import { Transactionable } from 'sequelize';

export type PrimaryKeyWithThroughValues = [TargetKey, Values];

export interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[];
}

export type setAssociationOptions =
  | TargetKey
  | TargetKey[]
  | PrimaryKeyWithThroughValues
  | PrimaryKeyWithThroughValues[]
  | AssociatedOptions;
