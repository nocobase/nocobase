/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Transaction } from '@nocobase/database';

import ManualInstruction from '../ManualInstruction';

import create from './create';
import update from './update';

export type FormHandler = (this: ManualInstruction, instance, formConfig, transaction?: Transaction) => Promise<void>;

export default function ({ formTypes }) {
  formTypes.register('create', create);
  formTypes.register('update', update);
}
