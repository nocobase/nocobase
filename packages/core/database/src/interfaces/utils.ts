/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '../database';
import { MultipleSelectInterface } from './index';

const interfaces = {
  multipleSelect: MultipleSelectInterface,
};

export function registerInterfaces(db: Database) {
  for (const [interfaceName, type] of Object.entries(interfaces)) {
    db.interfaceManager.registerInterfaceType(interfaceName, type);
  }
}
