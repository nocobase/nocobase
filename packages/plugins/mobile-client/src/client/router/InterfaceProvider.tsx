import React, { useContext } from 'react';

export const InterfaceContext = React.createContext(null);

export const InterfaceProvider = (props) => {
  return <InterfaceContext.Provider value={{ interface: true }}>{props.children}</InterfaceContext.Provider>;
};

export const useInterfaceContext = () => {
  return useContext(InterfaceContext);
};
