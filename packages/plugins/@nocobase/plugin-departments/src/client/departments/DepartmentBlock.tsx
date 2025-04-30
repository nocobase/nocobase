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

import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { DepartmentManagement } from './DepartmentManagement';
import { uid } from '@formily/shared';

export const DepartmentBlock: React.FC = () => {
  return (
    <SchemaComponent
      components={{ DepartmentManagement }}
      schema={{
        type: 'void',
        properties: {
          [uid()]: {
            type: 'void',
            'x-decorator': 'CardItem',
            'x-component': 'DepartmentManagement',
          },
        },
      }}
    />
  );
};
