import { ComponentType } from 'react';
import {
  SchemaSettingsCascaderItemProps,
  SchemaSettingsItemProps,
  SchemaSettingsModalItemProps,
  SchemaSettingsPopupProps,
  SchemaSettingsRemoveProps,
  SchemaSettingsSelectItemProps,
  SchemaSettingsSubMenuProps,
  SchemaSettingsSwitchItemProps,
} from '../../schema-settings';

export interface SchemaSettingOptions<T = {}> {
  name: string;
  Component?: ComponentType<T>;
  componentProps?: T;
  items: SchemaSettingsItemType[];
  style?: React.CSSProperties;
}

interface SchemaSettingsItemCommon<T = {}> {
  name: string;
  sort?: number;
  useVisible?: () => boolean;
  children?: SchemaSettingsItemType[];
  useChildren?: () => SchemaSettingsItemType[];
  /**
   * @default true
   */
  hideIfNoChildren?: boolean;
  componentProps?: Omit<T, 'children'>;
  useComponentProps?: () => Omit<T, 'children'>;
}

export interface SchemaSettingItemItemType extends SchemaSettingsItemCommon<SchemaSettingsItemProps> {
  type: 'item';
}

export interface SchemaSettingItemGroupType extends SchemaSettingsItemCommon<SchemaSettingsSubMenuProps> {
  type: 'itemGroup';
}

export interface SchemaSettingItemDividerProps extends SchemaSettingsItemCommon {
  type: 'divider';
}

export type SchemaSettingItemRemoveType = SchemaSettingsItemCommon<SchemaSettingsRemoveProps> & {
  type: 'remove';
};

export type SchemaSettingItemSelectType = SchemaSettingsItemCommon<SchemaSettingsSelectItemProps> & {
  type: 'select';
};

export type SchemaSettingItemCascaderType = SchemaSettingsItemCommon<SchemaSettingsCascaderItemProps> & {
  type: 'cascader';
};

interface SchemaSettingItemSwitchType extends SchemaSettingsItemCommon<SchemaSettingsSwitchItemProps> {
  type: 'switch';
}

export type SchemaSettingItemPopupType = SchemaSettingsItemCommon<SchemaSettingsPopupProps> & {
  type: 'popup';
};

export type SchemaSettingItemModalType = SchemaSettingsItemCommon<SchemaSettingsModalItemProps> & {
  type: 'modal';
};

export type SchemaSettingItemActionModalType = SchemaSettingsItemCommon<SchemaSettingsSelectItemProps> & {
  type: 'actionModal';
};

export interface SchemaSettingItemSubMenuType extends SchemaSettingsItemCommon<SchemaSettingsSubMenuProps> {
  type: 'subMenu';
}

export interface SchemaSettingItemComponentType<T = {}> extends SchemaSettingsItemCommon<T> {
  Component: string | ComponentType<T>;
}

export type SchemaSettingItemAllBuiltType =
  | SchemaSettingItemDividerProps
  | SchemaSettingItemRemoveType
  | SchemaSettingItemActionModalType
  | SchemaSettingItemSwitchType
  | SchemaSettingItemPopupType
  | SchemaSettingItemCascaderType
  | SchemaSettingItemModalType
  | SchemaSettingItemItemType
  | SchemaSettingItemSelectType
  | SchemaSettingItemSubMenuType
  | SchemaSettingItemGroupType;

export type SchemaSettingsItemType = SchemaSettingItemComponentType | SchemaSettingItemAllBuiltType;
export type SchemaSettingsItemTypeWithoutName =
  | Omit<SchemaSettingItemComponentType, 'name'>
  | Omit<SchemaSettingItemAllBuiltType, 'name'>;
