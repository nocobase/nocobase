/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps, DrawerProps, ModalProps } from 'antd';

export type ActionProps = ButtonProps & {
  component?: any;
  useAction?: () => {
    run(): Promise<void>;
  };
};

export type ComposedAction = React.FC<ActionProps> & {
  Drawer?: ComposedActionDrawer;
  [key: string]: any;
};

export type ComposedActionDrawer<T = DrawerProps> = React.FC<T & { footerNodeName?: string }> & {
  Footer?: React.FC;
};
