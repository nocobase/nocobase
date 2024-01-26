import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useRequest, SchemaComponent, SchemaComponentContext, SettingCenterPermissionProvider } from '@nocobase/client';
import { roleSchema } from './schemas/roles';
import { PermissionProvider } from './PermisionProvider';
import { useParams } from 'react-router-dom';

const AvailableActionsContext = createContext([]);

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
  const { name: dataSourceKey } = useParams();
  return (
    <div>
      <SchemaComponentContext.Provider value={{ designable: false }}>
        <AvailableActionsProver>
          <SchemaComponent
            schema={roleSchema}
            components={{ SettingCenterPermissionProvider, PermissionProvider }}
            scope={{ dataSourceKey }}
          />
        </AvailableActionsProver>
      </SchemaComponentContext.Provider>
    </div>
  );
};
