import { Schema } from '@formily/react';
import { DrawerProps, ModalProps } from 'antd';
import React, { createContext, useEffect, useRef, useState } from 'react';
import { useActionContext } from './hooks';
import { useDataBlockRequest } from '../../../data-source';

export const ActionContext = createContext<ActionContextProps>({});
ActionContext.displayName = 'ActionContext';

export const ActionContextProvider: React.FC<ActionContextProps & { value?: ActionContextProps }> = (props) => {
  const [submitted, setSubmitted] = useState(false); //是否有提交记录
  const contextProps = useActionContext();
  const { visible } = { ...props, ...props.value } || {};
  const isFirstRender = useRef(true); // 使用ref跟踪是否为首次渲染
  const service = useDataBlockRequest();
  const { setSubmitted: setParentSubmitted } = contextProps;

  useEffect(() => {
    if (visible !== undefined) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
      } else {
        if (visible === false && submitted) {
          service.refresh();
          setParentSubmitted?.(true); //传递给上一层
        }
      }
    }
    return () => {
      setSubmitted(false);
    };
  }, [visible]);

  return (
    <ActionContext.Provider value={{ ...contextProps, ...props, ...props?.value, submitted, setSubmitted }}>
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
  submitted?: boolean;
  setSubmitted?: (v: boolean) => void;
}
