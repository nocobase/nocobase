/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';

export const InterfaceContext = React.createContext(null);

export const InterfaceProvider = (props) => {
  return <InterfaceContext.Provider value={{ interface: true }}>{props.children}</InterfaceContext.Provider>;
};

export const useInterfaceContext = () => {
  return useContext(InterfaceContext);
};
