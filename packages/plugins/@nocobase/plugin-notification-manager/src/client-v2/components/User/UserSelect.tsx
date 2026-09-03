/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UsersSelect, type UsersSelectProps } from '@nocobase/plugin-workflow/client-v2';
import React from 'react';

export type UserSelectProps = UsersSelectProps;

export function UserSelect(props: UserSelectProps) {
  return <UsersSelect {...props} nullable />;
}

export default UserSelect;
