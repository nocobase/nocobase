import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useRequest } from '../../api-client';
import { useAdminSchemaUid } from '../../hooks';

const MenuItemsContext = createContext(null);
MenuItemsContext.displayName = 'MenuItemsContext';

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
  const adminSchemaUid = useAdminSchemaUid();
  const options = {
    url: `uiSchemas:getProperties/${adminSchemaUid}`,
  };
  const service = useRequest<{
    data: {
      properties: any;
    };
  }>(options);
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
