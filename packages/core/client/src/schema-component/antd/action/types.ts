/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';
import { ButtonProps, DrawerProps, ModalProps } from 'antd';
import { ComponentType } from 'react';

export type OpenSize = 'small' | 'middle' | 'large';
export interface ActionContextProps {
  /** Currently only used for Action.Popover */
  button?: React.JSX.Element;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  openMode?: 'drawer' | 'modal' | 'page';
  snapshot?: boolean;
  openSize?: OpenSize;
  /**
   * Customize the position of the pop-up window
   */
  containerRefKey?: string;
  formValueChanged?: boolean;
  setFormValueChanged?: (v: boolean) => void;
  fieldSchema?: Schema;
  drawerProps?: DrawerProps;
  modalProps?: ModalProps;
  submitted?: boolean;
  setSubmitted?: (v: boolean) => void;
  children?: React.ReactNode;
}

export type UseActionType = (callback?: () => void) => {
  run: () => void | Promise<void>;
};

export interface ActionProps extends ButtonProps {
  /**
   * button title
   */
  title?: string;

  /**
   * custom component, replace the default Button component
   */
  component?: string | ComponentType<any>;

  openMode?: ActionContextProps['openMode'];
  openSize?: ActionContextProps['openSize'];
  containerRefKey?: ActionContextProps['containerRefKey'];

  /**
   * Whether to display the popover, only valid when `openMode: 'popover'`
   */
  popover?: boolean;

  /**
   * When the button is clicked, whether a pop-up confirmation is required
   */
  confirm?:
    | false
    | {
        title: string;
        content: string;
      };

  /**
   * @deprecated
   */
  useAction?: string | UseActionType;
  /**
   * @deprecated
   */
  actionCallback?: () => void;

  /**
   * @internal
   */
  addChild?: boolean;
  onlyIcon?: boolean;
}

export type ComposedAction = React.FC<ActionProps> & {
  Drawer?: ComposedActionDrawer;
  [key: string]: any;
};

export type ActionDrawerProps<T = DrawerProps> = T & {
  footerNodeName?: string;
  /** 当前弹窗嵌套的层级 */
  level?: number;
  delay?: number;
};

export type ComposedActionDrawer<T = DrawerProps> = React.FC<ActionDrawerProps<T>> & {
  Footer?: React.FC;
  FootBar?: React.FC;
};
