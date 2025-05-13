/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext } from 'react';
import { ObservableModelManager } from './observableModelManager';

export const ObservableModelContext = createContext<{
  observableModelManager: ObservableModelManager;
}>(null);

export const useObservableModelManager = () => {
  const context = useContext(ObservableModelContext);
  if (!context) {
    throw new Error('useObservableModelManager must be used within a ObservableModelProvider');
  }
  return context.observableModelManager;
};

export const ObservableModelProvider: React.FC<{
  children?: React.ReactNode;
  observableModelManager: ObservableModelManager;
}> = (props) => {
  return (
    <ObservableModelContext.Provider
      value={{
        observableModelManager: props.observableModelManager,
      }}
    >
      {props.children}
    </ObservableModelContext.Provider>
  );
}; 