import { Schema } from '@formily/react';
import { DrawerProps, ModalProps } from 'antd';
import React, { createContext } from 'react';
import { useActionContext } from './hooks';

export const ActionContext = createContext<ActionContextProps>({});
ActionContext.displayName = 'ActionContext';

export const ActionContextProvider: React.FC<ActionContextProps & { value?: ActionContextProps }> = (props) => {
  const contextProps = useActionContext();
  return (
    <ActionContext.Provider value={{ ...contextProps, ...props, ...props?.value }}>
      {props.children}
    </ActionContext.Provider>
  );
};

export type OpenSize = 'small' | 'middle' | 'large';
export interface ActionContextProps {
  button?: any;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  openMode?: 'drawer' | 'modal' | 'page';
  snapshot?: boolean;
  openSize?: OpenSize;
  containerRefKey?: string;
  formValueChanged?: boolean;
  setFormValueChanged?: (v: boolean) => void;
  fieldSchema?: Schema;
  drawerProps?: DrawerProps;
  modalProps?: ModalProps;
}
