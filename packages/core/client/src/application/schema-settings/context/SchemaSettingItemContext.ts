/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';
import { SchemaSettingsItemType } from '../types';

export const SchemaSettingItemContext = createContext<SchemaSettingsItemType>({} as any);
SchemaSettingItemContext.displayName = 'SchemaSettingItemContext';

export function useSchemaSettingsItem<T = {}>() {
  return useContext(SchemaSettingItemContext) as T;
}
