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
import { Permissions } from './Permissions';

export const PermissionsTab = ({ TabLayout, activeKey, currentUserRole }) => {
  const t = useT();
  if (
    currentUserRole &&
    ((!currentUserRole.snippets.includes('pm.ai.employees') && !currentUserRole.snippets.includes('pm.*')) ||
      currentUserRole.snippets.includes('!pm.ai.employees'))
  ) {
    return null;
  }

  return {
    key: 'ai-employees',
    label: t('AI employees'),
    sort: 30,
    children: (
      <TabLayout>
        <Permissions active={activeKey === 'ai-employees'} />
      </TabLayout>
    ),
  };
};
