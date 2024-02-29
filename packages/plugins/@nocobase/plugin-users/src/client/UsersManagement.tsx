import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { usersSchema } from './schemas/users';
import { Card } from 'antd';
import { UserRolesField } from './UserRolesField';
import { useUsersTranslation } from './locale';
import { useFilterActionProps } from './hooks';

export const UsersManagement: React.FC = () => {
  const { t } = useUsersTranslation();
  return (
    <Card>
      <SchemaComponent schema={usersSchema} scope={{ t, useFilterActionProps }} components={{ UserRolesField }} />
    </Card>
  );
};
