import React, { createContext, useContext } from 'react';

export const ACLContext = createContext(null);

export function ACLProvider() {
  return (
    <ACLContext.Provider value={{}}>

    </ACLContext.Provider>
  )
}

export const useCurrentUser = () => {
  
};
