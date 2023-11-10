import { createContext, useContext } from 'react';
import { SchemaSettingItemType } from '../types';

export const SchemaSettingItemContext = createContext<SchemaSettingItemType>({} as any);

export function useSchemaSettingsItem<T = {}>(): T {
  return useContext(SchemaSettingItemContext) as T;
}
