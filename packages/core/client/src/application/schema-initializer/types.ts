import { ISchema } from '@formily/json-schema';
import { ButtonProps, ListProps, DropDownProps, PopoverProps } from 'antd';
import { ComponentType, ReactNode } from 'react';

export type InsertType = (s: ISchema) => void;

interface SchemaInitializerItemBaseType {
  name: string | number;
  sort?: number;
  Component?: string | ComponentType<any>;
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
  type?: 'itemGroup' | 'subMenu';
  children?: SchemaInitializerItemType[];
  checkChildrenLength?: boolean;
  useChildren?: () => SchemaInitializerItemType[];
}

export type SchemaInitializerItemType =
  | SchemaInitializerItemDividerType
  | SchemaInitializerItemOnlyType
  | SchemaInitializerItemWithChildren;

// TODO: 类型需要优化
export interface SchemaInitializerOptions<P1 = ButtonProps, P2 = ListProps<any>> {
  title?: string;
  insertPosition?: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd';

  Component?: ComponentType<P1>;
  componentProps?: P1;
  // Like the `style` parameter, it is used to modify the style of the `Component` component.
  componentStyle?: React.CSSProperties;
  style?: React.CSSProperties;

  ItemsComponent?: ComponentType<P2>;
  itemsComponentProps?: P2;
  itemsComponentStyle?: React.CSSProperties;

  noDropdown?: boolean;
  popoverProps?: PopoverProps;
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
