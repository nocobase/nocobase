import { createContext, useContext } from 'react';
import { SchemaSettingItemType } from '../types';

export const SchemaSettingItemContext = createContext<SchemaSettingItemType>({} as any);

export function useSchemaSettingsItem() {
  return useContext(SchemaSettingItemContext) as SchemaSettingItemType;
}
