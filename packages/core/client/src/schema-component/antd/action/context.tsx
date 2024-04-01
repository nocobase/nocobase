import { Schema } from '@formily/react';
import { DrawerProps, ModalProps } from 'antd';
import React, { createContext, useEffect, useRef, useState, useContext } from 'react';
import { useActionContext } from './hooks';
import { useDataBlockRequest } from '../../../data-source';

export const ActionContext = createContext<ActionContextProps>({});
ActionContext.displayName = 'ActionContext';
const RefreshDataBlockRequestAction = ['create', 'view', 'update', 'destroy', 'customize'];

const SubmittedContext = createContext<{ submitted?: boolean; setSubmitted?: (v: boolean) => void }>({});

const SubmittedContextProvider = (props) => {
  const [submitted, setSubmitted] = useState(false);
  return <SubmittedContext.Provider value={{ submitted, setSubmitted }}>{props.children}</SubmittedContext.Provider>;
};
export const useSubmittedContext = () => {
  return useContext(SubmittedContext);
};

export const ActionContextProvider: React.FC<ActionContextProps & { value?: ActionContextProps }> = (props) => {
  const contextProps = useActionContext();
  const { visible, fieldSchema } = props || props.value || {};
  const isFirstRender = useRef(true); // 使用ref跟踪是否为首次渲染
  const service = useDataBlockRequest();
  const { refreshDataBlockRequest } = fieldSchema?.['x-component-props'] || {};
  useEffect(() => {
    if (
      visible !== undefined &&
      refreshDataBlockRequest !== false &&
      RefreshDataBlockRequestAction.find((v) => fieldSchema?.['x-action']?.includes?.(v))
    ) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
      } else {
        if (visible === false) {
          service.refresh();
        }
      }
    }
  }, [visible]);

  return (
    <ActionContext.Provider value={{ ...contextProps, ...props, ...props?.value }}>
      <SubmittedContextProvider>{props.children}</SubmittedContextProvider>
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
