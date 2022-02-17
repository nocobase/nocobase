import { ISchema } from '@formily/react';
import { ButtonProps, DropDownProps, MenuItemProps } from 'antd';

export interface SchemaInitializerButtonProps extends ButtonProps {
  insert?: (s: ISchema) => void;
  wrap?: (s: ISchema) => ISchema;
  insertPosition?: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd';
  items?: SchemaInitializerItemOptions[];
  dropdown?: DropDownProps;
}

export type SchemaInitializerItemOptions = ItemGroupOptions | SubMenuOptions | ItemOptions | DividerOptions;

interface ItemCommonOptions {
  title?: any;
}

interface ItemGroupOptions extends ItemCommonOptions {
  type: 'itemGroup';
  children?: SchemaInitializerItemOptions[];
}

interface SubMenuOptions extends ItemCommonOptions {
  type: 'subMenu';
  children?: SchemaInitializerItemOptions[];
}

interface ItemOptions extends ItemCommonOptions {
  type: 'item';
  component?: any;
  schema?: ISchema;
  [key: string]: any;
}

interface DividerOptions {
  type: 'divider';
}

export type SchemaInitializerItemComponent = (props?: SchemaInitializerItemComponentProps) => any;

interface SchemaInitializerItemComponentProps {
  insert?: (s: ISchema) => void;
  item?: ItemOptions;
}

export interface SchemaInitializerItemProps extends Omit<MenuItemProps, 'onClick'> {
  items?: SchemaInitializerItemOptions[];
  onClick?: MenuClickEventHandler;
}

type MenuClickEventHandler = (info: MenuInfo) => void;

interface MenuInfo {
  // key: string;
  // keyPath: string[];
  item: ItemOptions;
  domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
}
