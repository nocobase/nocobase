import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useRequest } from '../../api-client';
import { SchemaComponent, SchemaComponentContext } from '../../schema-component';
import { MenuItemsProvider } from '../Configuration/MenuItemsProvider';
import { PermissionProvider, SettingCenterPermissionProvider } from '../Configuration/PermisionProvider';
import { roleSchema } from './schemas/roles';

const AvailableActionsContext = createContext([]);
AvailableActionsContext.displayName = 'AvailableActionsContext';

const AvailableActionsProver: React.FC = (props) => {
  const { data, loading } = useRequest<{
    data: any[];
  }>({
    resource: 'availableActions',
    action: 'list',
  });
  if (loading) {
    return <Spin />;
  }
  return <AvailableActionsContext.Provider value={data?.data}>{props.children}</AvailableActionsContext.Provider>;
};

export const useAvailableActions = () => {
  return useContext(AvailableActionsContext);
};

export const RoleTable = () => {
  return (
    <div>
      <SchemaComponentContext.Provider value={{ designable: false }}>
        <AvailableActionsProver>
          <SchemaComponent
            schema={roleSchema}
            components={{ MenuItemsProvider, SettingCenterPermissionProvider, PermissionProvider }}
          />
        </AvailableActionsProver>
      </SchemaComponentContext.Provider>
    </div>
  );
};
