import { Schema } from '@formily/react';
import { DrawerProps, ModalProps } from 'antd';
import React, { Ref, createContext, useRef } from 'react';
import { useActionContext } from './hooks';

export const ActionContext = createContext<ActionContextProps & { formValueChanged?: React.MutableRefObject<boolean> }>(
  {},
);
ActionContext.displayName = 'ActionContext';

export const ActionContextProvider: React.FC<ActionContextProps & { value?: ActionContextProps }> = (props) => {
  const contextProps = useActionContext();
  const formValueChanged = useRef(false);
  return (
    <ActionContext.Provider value={{ ...contextProps, ...props, ...props?.value, formValueChanged }}>
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
  fieldSchema?: Schema;
  drawerProps?: DrawerProps;
  modalProps?: ModalProps;
}
