import { ComponentType } from 'react';
import {
  SchemaSettingsCascaderItemProps,
  SchemaSettingsItemProps,
  SchemaSettingsModalItemProps,
  SchemaSettingsPopupProps,
  SchemaSettingsProps,
  SchemaSettingsRemoveProps,
  SchemaSettingsSubMenuProps,
  SchemaSettingsSwitchItemProps,
} from '../../schema-settings';

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
  useComponentProps?: () => T;
  useVisible?: () => boolean;
  [index: string]: any;
};

export interface SchemaSettingItemNoProps extends SchemaSettingItemBaseType {
  type: 'divider' | 'blockTitle';
}

export interface SchemaSettingItemCommonType extends SchemaSettingItemBaseType<SchemaSettingsItemProps> {
  type: 'item';
}

export type SchemaSettingItemWithChildrenType = SchemaSettingItemBaseType<SchemaSettingsSubMenuProps> & {
  type: 'subMenu' | 'itemGroup';
  children?: SchemaSettingItemBaseType[];
};

export type SchemaSettingItemRemoveType = SchemaSettingItemBaseType<SchemaSettingsRemoveProps> & {
  type: 'remove';
};

interface SchemaSettingItemSwitchType extends SchemaSettingItemBaseType<SchemaSettingsSwitchItemProps> {
  type: 'switch';
}

export type SchemaSettingItemPopupType = SchemaSettingItemBaseType<SchemaSettingsPopupProps> & {
  type: 'popup';
};

export type SchemaSettingItemCascaderType = SchemaSettingItemBaseType<SchemaSettingsCascaderItemProps> & {
  type: 'cascader';
};

export type SchemaSettingItemModalType = SchemaSettingItemBaseType<SchemaSettingsModalItemProps> & {
  type: 'modal';
};

export type SchemaSettingItemType =
  | SchemaSettingItemNoProps
  | SchemaSettingItemRemoveType
  | SchemaSettingItemSwitchType
  | SchemaSettingItemPopupType
  | SchemaSettingItemCascaderType
  | SchemaSettingItemModalType
  | SchemaSettingItemCommonType
  | SchemaSettingItemWithChildrenType
  | SchemaSettingItemBaseType;
