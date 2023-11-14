import { createContext, useContext } from 'react';
import { SchemaSettingItemType } from '../types';

export const SchemaSettingItemContext = createContext<SchemaSettingItemType>({} as any);
SchemaSettingItemContext.displayName = 'SchemaSettingItemContext';

export function useSchemaSettingsItem() {
  return useContext(SchemaSettingItemContext) as SchemaSettingItemType;
}
