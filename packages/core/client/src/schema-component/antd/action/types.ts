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
