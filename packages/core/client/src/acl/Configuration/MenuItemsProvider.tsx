import React, { createContext, useContext } from 'react';
import { useRequest, useAPIClient } from '../../api-client';
import { useRoute } from '../../route-switch';
import { Spin } from '../../spin';

const MenuItemsContext = createContext(null);

export const toItems = (properties = {}) => {
  const items = [];
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const element = properties[key];
      const item = {
        title: element.title,
        uid: element['x-uid'],
      };
      if (element.properties) {
        item['children'] = toItems(element.properties);
      }
      items.push(item);
    }
  }
  return items;
};

export const useMenuItems = () => {
  return useContext(MenuItemsContext);
};

export const MenuItemsProvider = (props) => {
  const route = useRoute();
  const options = {
    url: `uiSchemas:getProperties/${route.uiSchemaUid}`,
  };
  const service = useRequest(options);
  if (service.loading) {
    return <Spin />;
  }
  const items = toItems(service.data?.data?.properties);
  return (
    <MenuItemsContext.Provider
      value={{
        service: service,
        items,
      }}
    >
      {props.children}
    </MenuItemsContext.Provider>
  );
};
