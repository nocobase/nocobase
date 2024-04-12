import { createContext, useContext } from 'react';
import { SchemaSettingsItemType } from '../types';

export const SchemaSettingItemContext = createContext<SchemaSettingsItemType>({} as any);
SchemaSettingItemContext.displayName = 'SchemaSettingItemContext';

export function useSchemaSettingsItem<T = {}>() {
  return useContext(SchemaSettingItemContext) as T;
}
