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

import { Plugin, SchemaComponentContext, useSchemaComponentContext } from '@nocobase/client';
import { tval } from '@nocobase/utils/client';
import { DepartmentBlock } from './departments/DepartmentBlock';
import React from 'react';
import { ResourcesProvider } from './ResourcesProvider';
import ACLPlugin from '@nocobase/plugin-acl/client';
import { RoleDepartmentsManager } from './roles/RoleDepartmentsManager';
import {
  UserDepartmentsFieldSettings,
  ReadOnlyAssociationField,
  UserMainDepartmentFieldSettings,
  DepartmentOwnersFieldSettings,
} from './components';
import { DepartmentOwnersField } from './departments/DepartmentOwnersField';

export class PluginDepartmentsClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.addComponents({
      UserDepartmentsField: ReadOnlyAssociationField,
      UserMainDepartmentField: ReadOnlyAssociationField,
      DepartmentOwnersField: DepartmentOwnersField,
    });
    this.app.schemaSettingsManager.add(UserDepartmentsFieldSettings);
    this.app.schemaSettingsManager.add(UserMainDepartmentFieldSettings);
    this.app.schemaSettingsManager.add(DepartmentOwnersFieldSettings);

    this.app.pluginSettingsManager.add('users-permissions.departments', {
      icon: 'ApartmentOutlined',
      title: tval('Departments', { ns: 'departments' }),
      Component: () => {
        const scCtx = useSchemaComponentContext();
        return (
          <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
            <ResourcesProvider>
              <DepartmentBlock />
            </ResourcesProvider>
          </SchemaComponentContext.Provider>
        );
      },
      sort: 2,
      aclSnippet: 'pm.departments',
    });

    const acl = this.app.pm.get(ACLPlugin);
    acl.rolesManager.add('departments', {
      title: tval('Departments', { ns: 'departments' }),
      Component: RoleDepartmentsManager,
    });
  }
}

export default PluginDepartmentsClient;
