import { ISchema } from '@formily/json-schema';
import { ButtonProps, PopoverProps } from 'antd';
import { ComponentType, ReactNode } from 'react';
import type {
  SchemaInitializerItemGroupProps,
  SchemaInitializerItemProps,
  SchemaInitializerSubMenuProps,
} from './components';

export type InsertType = (s: ISchema) => void;

export interface SchemaInitializerComponentCommonProps {
  title?: string;
  schema?: ISchema;
  style?: React.CSSProperties;
  className?: string;
}
export const schemaInitializerComponentCommonProps: (keyof SchemaInitializerComponentCommonProps)[] = [
  'schema',
  'title',
  'style',
  'className',
];

export interface SchemaInitializerItemBaseType<T = {}> extends SchemaInitializerComponentCommonProps {
  name: string;
  sort?: number;
  Component?: string | ComponentType<T>;
  componentProps?: T;
  useVisible?: () => boolean;
  [index: string]: any;
}

export interface SchemaInitializerItemBaseWithChildren<T = {}> extends SchemaInitializerItemBaseType<T> {
  children?: SchemaInitializerItemType[];
  checkChildrenLength?: boolean;
  useChildren?: () => SchemaInitializerItemType[];
}

export interface SchemaInitializerItemDividerType extends SchemaInitializerItemBaseType {
  type: 'divider';
}

export type SchemaInitializerItemOnlyType = {
  type: 'item';
} & SchemaInitializerItemProps &
  SchemaInitializerItemBaseType;

export type SchemaInitializerItemGroupType = {
  type: 'itemGroup';
} & SchemaInitializerItemBaseWithChildren &
  SchemaInitializerItemGroupProps;

export type SchemaInitializerSubMenuType = {
  type: 'subMenu';
} & SchemaInitializerItemBaseWithChildren &
  SchemaInitializerSubMenuProps;

export type SchemaInitializerItemType<T = {}> =
  | SchemaInitializerItemBaseType<T>
  | SchemaInitializerItemBaseWithChildren<T>
  | SchemaInitializerItemDividerType
  | SchemaInitializerItemOnlyType
  | SchemaInitializerItemGroupType
  | SchemaInitializerSubMenuType;

// TODO: 类型需要优化
export interface SchemaInitializerOptions<P1 = ButtonProps, P2 = {}> {
  Component?: ComponentType<P1>;
  componentProps?: P1;
  style?: React.CSSProperties;
  title?: string;
  icon?: ReactNode;

  items?: SchemaInitializerItemType[];
  ItemsComponent?: ComponentType<P2>;
  itemsComponentProps?: P2;
  itemsComponentStyle?: React.CSSProperties;

  insertPosition?: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd';
  designable?: boolean;
  wrap?: (s: ISchema) => ISchema;
  onSuccess?: (data: any) => void;
  insert?: InsertType;
  useInsert?: () => InsertType;

  /**
   * @default true
   */
  popover?: boolean;
  popoverProps?: PopoverProps;
  [index: string]: any;
}
