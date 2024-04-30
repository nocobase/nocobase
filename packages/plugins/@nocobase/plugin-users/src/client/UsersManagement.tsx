/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent, SchemaComponentContext, useSchemaComponentContext } from '@nocobase/client';
import React from 'react';
import { usersSchema } from './schemas/users';
import { Card } from 'antd';
import { UserRolesField } from './UserRolesField';
import { useUsersTranslation } from './locale';
import { useFilterActionProps } from './hooks';
import { PasswordField } from './PasswordField';

export const UsersManagement: React.FC = () => {
  const { t } = useUsersTranslation();
  const scCtx = useSchemaComponentContext();
  return (
    <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
      <Card>
        <SchemaComponent
          schema={usersSchema}
          scope={{ t, useFilterActionProps }}
          components={{ UserRolesField, PasswordField }}
        />
      </Card>
    </SchemaComponentContext.Provider>
  );
};
