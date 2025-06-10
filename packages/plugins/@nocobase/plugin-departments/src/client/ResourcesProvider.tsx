/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { CollectionProvider_deprecated, ResourceActionContext, TableBlockContext, useRequest } from '@nocobase/client';
import React, { useContext, useEffect, useMemo } from 'react';
import { departmentCollection } from './collections/departments';
import { userCollection } from './collections/users';
import { FormContext } from '@formily/react';
import { createForm } from '@formily/core';

export const ResourcesContext = React.createContext<{
  user: any;
  setUser?: (user: any) => void;
  department: any; // department name
  setDepartment?: (department: any) => void;
  departmentsResource?: any;
  usersResource?: any;
}>({
  user: {},
  department: {},
});

export const ResourcesProvider: React.FC = (props) => {
  const [user, setUser] = React.useState(null);
  const [department, setDepartment] = React.useState(null);

  const userService = useRequest({
    resource: 'users',
    action: 'list',
    params: {
      appends: ['departments', 'departments.parent(recursively=true)'],
      filter: department
        ? {
            'departments.id': department.id,
          }
        : {},
      pageSize: 20,
    },
  });

  useEffect(() => {
    userService.run();
  }, [department]);

  const departmentRequest = {
    resource: 'departments',
    action: 'list',
    params: {
      paginate: false,
      filter: {
        parentId: null,
      },
    },
  };
  const departmentService = useRequest(departmentRequest);

  return (
    <ResourcesContext.Provider
      value={{
        user,
        setUser,
        department,
        setDepartment,
        usersResource: { service: userService },
        departmentsResource: { service: departmentService },
      }}
    >
      {props.children}
    </ResourcesContext.Provider>
  );
};

export const DepartmentsListProvider: React.FC = (props) => {
  const { departmentsResource } = useContext(ResourcesContext);
  const { service } = departmentsResource || {};
  return (
    <ResourceActionContext.Provider value={{ ...service }}>
      <CollectionProvider_deprecated collection={departmentCollection}>{props.children}</CollectionProvider_deprecated>
    </ResourceActionContext.Provider>
  );
};

export const UsersListProvider: React.FC = (props) => {
  const { usersResource } = useContext(ResourcesContext);
  const { service } = usersResource || {};
  const form = useMemo(() => createForm(), []);
  const field = form.createField({ name: 'table' });
  return (
    <FormContext.Provider value={form}>
      <TableBlockContext.Provider value={{ service, field }}>
        <CollectionProvider_deprecated collection={userCollection}>{props.children}</CollectionProvider_deprecated>
      </TableBlockContext.Provider>
    </FormContext.Provider>
  );
};
