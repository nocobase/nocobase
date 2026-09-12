/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import type { PermissionTabProps } from '@nocobase/plugin-acl/client-v2';
import { Permissions } from './Permissions';

export const AI_EMPLOYEES_PERMISSION_TAB_KEY = 'ai-employees';

export default function PermissionsTab(props: PermissionTabProps) {
  return (
    <Permissions
      active={props.activeKey === AI_EMPLOYEES_PERMISSION_TAB_KEY}
      role={props.activeRole}
      onRoleChange={props.onRoleChange}
    />
  );
}
