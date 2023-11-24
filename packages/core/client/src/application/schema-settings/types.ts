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
  items: SchemaSettingItemType[];
  style?: React.CSSProperties;
}

interface SchemaSettingItemCommon<T = {}> {
  name: string;
  sort?: number;
  useVisible?: () => boolean;
  children?: SchemaSettingItemType[];
  useChildren?: () => SchemaSettingItemType[];
  checkChildrenLength?: boolean;
  componentProps?: Omit<T, 'children'>;
  useComponentProps?: () => Omit<T, 'children'>;
}

export interface SchemaSettingItemNoProps extends SchemaSettingItemCommon {
  type: 'divider' | 'blockTitle';
}

export interface SchemaSettingItemItemType extends SchemaSettingItemCommon<SchemaSettingsItemProps> {
  type: 'item';
}

export type SchemaSettingItemWithChildrenType = SchemaSettingItemCommon<SchemaSettingsSubMenuProps> & {
  type: 'subMenu' | 'itemGroup';
};

export type SchemaSettingItemRemoveType = SchemaSettingItemCommon<SchemaSettingsRemoveProps> & {
  type: 'remove';
};

interface SchemaSettingItemSwitchType extends SchemaSettingItemCommon<SchemaSettingsSwitchItemProps> {
  type: 'switch';
}

export type SchemaSettingItemPopupType = SchemaSettingItemCommon<SchemaSettingsPopupProps> & {
  type: 'popup';
};

export type SchemaSettingItemCascaderType = SchemaSettingItemCommon<SchemaSettingsCascaderItemProps> & {
  type: 'cascader';
};

export type SchemaSettingItemModalType = SchemaSettingItemCommon<SchemaSettingsModalItemProps> & {
  type: 'modal';
};

export type SchemaSettingItemSelectType = SchemaSettingItemCommon<SchemaSettingsSelectItemProps> & {
  type: 'select';
};

export type SchemaSettingItemActionModalType = SchemaSettingItemCommon<SchemaSettingsSelectItemProps> & {
  type: 'actionModal';
};

interface SchemaSettingItemComponentType<T = {}> extends SchemaSettingItemCommon<T> {
  Component: string | ComponentType<any>;
}

export type SchemaSettingItemType =
  | SchemaSettingItemComponentType
  | SchemaSettingItemNoProps
  | SchemaSettingItemRemoveType
  | SchemaSettingItemActionModalType
  | SchemaSettingItemSwitchType
  | SchemaSettingItemPopupType
  | SchemaSettingItemCascaderType
  | SchemaSettingItemModalType
  | SchemaSettingItemItemType
  | SchemaSettingItemSelectType
  | SchemaSettingItemWithChildrenType
  | SchemaSettingItemComponentType;
