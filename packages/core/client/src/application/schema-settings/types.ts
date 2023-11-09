import { ComponentType } from 'react';
import {
  SchemaSettingsCascaderItemProps,
  SchemaSettingsItemProps,
  SchemaSettingsModalItemProps,
  SchemaSettingsPopupProps,
  SchemaSettingsProps,
  SchemaSettingsRemoveProps,
  SchemaSettingsSelectItemProps,
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

export type SchemaSettingItemBaseType<T = any> = {
  name: string;
  sort?: number;
  Component?: string | ComponentType<Omit<T, 'children'>>;
  componentProps?: Omit<T, 'children'>;
  useComponentProps?: () => Omit<T, 'children'>;
  useVisible?: () => boolean;
  children?: SchemaSettingItemBaseType[];
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

export type SchemaSettingItemSelectType = SchemaSettingItemBaseType<SchemaSettingsSelectItemProps> & {
  type: 'select';
};

export type SchemaSettingComponentItem = {
  name: string;
  Component: string | ComponentType;
  sort?: number;
  componentProps?: any;
  useComponentProps?: () => any;
  useVisible?: () => boolean;
  children?: SchemaSettingItemBaseType[];
};

export type SchemaSettingItemType =
  | SchemaSettingComponentItem
  | SchemaSettingItemNoProps
  | SchemaSettingItemRemoveType
  | SchemaSettingItemSwitchType
  | SchemaSettingItemPopupType
  | SchemaSettingItemCascaderType
  | SchemaSettingItemModalType
  | SchemaSettingItemCommonType
  | SchemaSettingItemSelectType
  | SchemaSettingItemWithChildrenType;
