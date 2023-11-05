import { createContext, useContext } from 'react';
import { SchemaSettingItemType } from '../types';

export interface SchemaSettingItemContextValue
  extends Omit<
    SchemaSettingItemType,
    'type' | 'Component' | 'useVisible' | 'useChildren' | 'checkChildrenLength' | 'sort' | 'componentProps'
  > {
  designerContext?: any;
}

export const SchemaSettingItemContext = createContext<SchemaSettingItemContextValue>({} as any);

export function useSchemaSettingItem<T = {}>(): T {
  return useContext(SchemaSettingItemContext) as T;
}
