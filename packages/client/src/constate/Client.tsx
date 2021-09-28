import React, { createContext, useContext } from 'react';
import { UseRequestProvider } from 'ahooks';

const ClientContext = createContext({
  client: null,
});

export function ClientProvider(props) {
  const { client } = props;
  return (
    <ClientContext.Provider value={client}>
      <UseRequestProvider
        value={{
          requestMethod: (service) => client.request(service),
        }}
      >
        {props.children}
      </UseRequestProvider>
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
