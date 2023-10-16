import { ISchema } from '@formily/json-schema';
import { ButtonProps, ListProps, DropDownProps } from 'antd';
import { ListItemProps } from 'antd/es/list';
import { ComponentType, ReactNode } from 'react';

export type InsertType = (s: ISchema) => void;

interface SchemaInitializerItemBaseType {
  name: string;
  sort?: number;
  Component?: string | ComponentType<{ name?: string; insert?: InsertType; item: SchemaInitializerItemType }>;
  useVisible?: () => boolean;
  [index: string]: any;
}

interface SchemaInitializerItemDividerType extends Partial<SchemaInitializerItemBaseType> {
  type: 'divider';
}

interface SchemaInitializerItemOnlyType extends Partial<SchemaInitializerItemBaseType> {
  type: 'item';
}

interface SchemaInitializerItemWithChildren extends Partial<SchemaInitializerItemBaseType> {
  type?: 'itemGroup' | 'itemMenu' | 'subMenu';
  children?: SchemaInitializerItemType[] | ComponentType;
  useChildren?: () => SchemaInitializerItemType[];
}

export type SchemaInitializerItemType =
  | SchemaInitializerItemDividerType
  | SchemaInitializerItemOnlyType
  | SchemaInitializerItemWithChildren;

// TODO: 类型需要优化
export interface SchemaInitializerOptions<P1 = ButtonProps, P2 = ListProps<any>, P3 = ListItemProps> {
  title?: string;
  insertPosition?: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd';

  Component?: ComponentType<SchemaInitializerOptions<P1, P2, P3>>;
  componentProps?: P1;
  componentStyle?: React.CSSProperties;
  style?: React.CSSProperties;

  ListComponent?: ComponentType<SchemaInitializerOptions<P1, P2, P3>>;
  listProps?: P2;
  listStyle?: React.CSSProperties;

  noDropdown?: boolean;
  dropdownProps?: DropDownProps;
  designable?: boolean;
  wrap?: (s: ISchema) => ISchema;
  insert?: InsertType;
  useInsert?: () => InsertType;
  onSuccess?: (data: any) => void;
  items?: SchemaInitializerItemType[];
  icon?: ReactNode;
  'data-testid'?: string;
  [index: string]: any;
}
