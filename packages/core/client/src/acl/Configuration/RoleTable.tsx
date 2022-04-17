import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useRequest } from '../../api-client';
import { useRoute } from '../../route-switch';
import { SchemaComponent } from '../../schema-component';
import { roleSchema } from './schemas/roles';

const toItems = (properties = {}) => {
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

const AvailableActionsContext = createContext(null);
const MenuItemsContext = createContext(null);

const AvailableActionsProver: React.FC = (props) => {
  const { data, loading } = useRequest({
    resource: 'availableActions',
    action: 'list',
  });
  if (loading) {
    return <Spin />;
  }
  return <AvailableActionsContext.Provider value={data?.data}>{props.children}</AvailableActionsContext.Provider>;
};

const MenuItemsProver: React.FC = (props) => {
  const route = useRoute();
  const { loading, data } = useRequest({
    url: `uiSchemas:getProperties/${route.uiSchemaUid}`,
  });
  if (loading) {
    return <Spin />;
  }
  const items = toItems(data?.data?.properties);
  return <MenuItemsContext.Provider value={items}>{props.children}</MenuItemsContext.Provider>;
};

export const useAvailableActions = () => {
  return useContext(AvailableActionsContext);
};

export const useMenuItems = () => {
  return useContext(MenuItemsContext);
};

export const RoleTable = () => {
  return (
    <div>
      <AvailableActionsProver>
        <MenuItemsProver>
          <SchemaComponent schema={roleSchema} />
        </MenuItemsProver>
      </AvailableActionsProver>
    </div>
  );
};
