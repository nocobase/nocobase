/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useT } from '../../locale';
import { RolesManagerContext } from '@nocobase/plugin-acl/client';
import V2PermissionsTab from '../../../client-v2/pages/permissions/PermissionsTab';

type PermissionsTabProps = {
  TabLayout: React.FC<{ children?: React.ReactNode }>;
  activeKey: string;
  currentUserRole?: {
    name: string;
    title: string;
    description?: string;
    strategy?: {
      actions?: string[];
    };
    default?: boolean;
    hidden?: boolean;
    allowConfigure?: boolean;
    allowNewMenu?: boolean;
    snippets?: string[];
  } | null;
};

export const PermissionsTab = ({ TabLayout, activeKey, currentUserRole }: PermissionsTabProps) => {
  const t = useT();
  const { role, setRole } = React.useContext(RolesManagerContext);
  if (
    currentUserRole &&
    ((!(currentUserRole.snippets ?? []).includes('pm.ai.employees') &&
      !(currentUserRole.snippets ?? []).includes('pm.*')) ||
      (currentUserRole.snippets ?? []).includes('!pm.ai.employees'))
  ) {
    return null;
  }

  return {
    key: 'ai-employees',
    label: t('AI employees'),
    sort: 30,
    children: (
      <TabLayout>
        <V2PermissionsTab
          activeKey={activeKey}
          activeRole={role ?? null}
          currentUserRole={currentUserRole}
          onRoleChange={(nextRole) => {
            if (nextRole && role) {
              setRole({
                ...role,
                ...nextRole,
                description: nextRole.description ?? role.description,
                strategy: {
                  actions: nextRole.strategy?.actions ?? role.strategy.actions,
                },
                snippets: nextRole.snippets ?? role.snippets,
              });
            }
          }}
        />
      </TabLayout>
    ),
  };
};
