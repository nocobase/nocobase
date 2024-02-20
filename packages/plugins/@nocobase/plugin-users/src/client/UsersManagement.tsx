import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { usersSchema } from './schemas/users';
import { Card } from 'antd';
import { UserRolesField } from './UserRolesField';

export const UsersManagement: React.FC = () => {
  return (
    <Card>
      <SchemaComponent schema={usersSchema} components={{ UserRolesField }} />
    </Card>
  );
};
