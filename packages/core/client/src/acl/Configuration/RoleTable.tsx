import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useRequest } from '../../api-client';
import { SchemaComponent } from '../../schema-component';
import { roleSchema } from './schemas/roles';



const AvailableActionsContext = createContext(null);

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



export const useAvailableActions = () => {
  return useContext(AvailableActionsContext);
};


export const RoleTable = () => {
  return (
    <div>
      <AvailableActionsProver>
          <SchemaComponent schema={roleSchema} />
      </AvailableActionsProver>
    </div>
  );
};
