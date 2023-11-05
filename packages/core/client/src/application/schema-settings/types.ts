import { ComponentType } from 'react';
import { SchemaSettingsProps } from '../../schema-settings';

export interface SchemaSettingOptions<T = {}> extends Omit<SchemaSettingsProps, 'title' | 'children'> {
  name: string;
  Component?: ComponentType<T>;
  componentProps?: T;
  items: SchemaSettingItemType[];
  style?: React.CSSProperties;
}

export type SchemaSettingItemBaseType<T = {}> = {
  name: string;
  sort?: number;
  Component?: string | ComponentType<T>;
  componentProps?: T;
  useVisible?: () => boolean;
  [index: string]: any;
};

export type SchemaSettingItemWithChildrenType<T = {}> = SchemaSettingItemBaseType<T> & {
  type: 'subMenu' | 'itemGroup';
  children?: SchemaSettingItemBaseType[];
};

// export interface SchemaSettingItemDividerType extends Partial<SchemaSettingItemBaseType> {
//   type: 'divider';
// }

export type SchemaSettingItemType = SchemaSettingItemBaseType | SchemaSettingItemWithChildrenType;
