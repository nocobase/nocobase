import { ISchema } from '@formily/json-schema';
import { ButtonProps, ListProps, DropDownProps } from 'antd';
import { ListItemProps } from 'antd/es/list';
import { ComponentType, ReactNode } from 'react';

export type InsertType = (s: ISchema) => void;

// TODO: 类型需要优化
export type SchemaInitializerListItemType<P = {}> = P & {
  name: string;
  /**
   * default: 0
   * 值越小，排序越靠前
   */
  sort?: number;
  type?: 'itemGroup' | 'itemMenu' | 'item' | 'divider' | 'subMenu';
  Component?: string | ComponentType<P & { name?: string; insert?: InsertType }>;
  children?: SchemaInitializerListItemType[] | ComponentType;
  useChildren?: () => SchemaInitializerListItemType[];
  [index: string]: any;
};

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

  dropdownProps?: DropDownProps;
  designable?: boolean;
  wrap?: (s: ISchema) => ISchema;
  insert?: InsertType;
  onSuccess?: (data: any) => void;
  list?: SchemaInitializerListItemType[];
  icon?: ReactNode;
  'data-testid'?: string;
  [index: string]: any;
}
