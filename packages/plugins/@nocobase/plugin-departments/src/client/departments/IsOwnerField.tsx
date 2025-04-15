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

import React, { useContext } from 'react';
import { useDepartmentTranslation } from '../locale';
import { Checkbox, useRecord } from '@nocobase/client';
import { ResourcesContext } from '../ResourcesProvider';

export const IsOwnerField: React.FC = () => {
  const { department } = useContext(ResourcesContext);
  const record = useRecord() as any;
  const dept = (record.departments || []).find((dept: any) => dept?.id === department?.id);

  return <Checkbox.ReadPretty value={dept?.departmentsUsers.isOwner} />;
};
