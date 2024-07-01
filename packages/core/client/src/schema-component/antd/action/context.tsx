/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useEffect, useRef, useState } from 'react';
import { useDataBlockRequest } from '../../../data-source';
import { ActionContextProps } from './types';

export const ActionContext = createContext<ActionContextProps>({});
ActionContext.displayName = 'ActionContext';

export const ActionContextProvider: React.FC<ActionContextProps & { value?: ActionContextProps }> = (props) => {
  const [submitted, setSubmitted] = useState(false); //是否有提交记录
  const { visible } = { ...props, ...props.value } || {};
  const isFirstRender = useRef(true); // 使用ref跟踪是否为首次渲染
  const service = useDataBlockRequest();
  const { setSubmitted: setParentSubmitted } = { ...props, ...props.value };
  useEffect(() => {
    if (visible !== undefined) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
      } else {
        if (visible === false && submitted && service) {
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
    <ActionContext.Provider value={{ ...props, ...props?.value, submitted, setSubmitted }}>
      {props.children}
    </ActionContext.Provider>
  );
};
