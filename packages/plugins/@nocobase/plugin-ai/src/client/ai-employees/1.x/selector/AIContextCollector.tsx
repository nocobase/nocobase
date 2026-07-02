/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { useResourceActionContext } from '@nocobase/client';
import { registerDataModelingRefreshHandler } from '../../../../client-v2/ai-employees/tools';

export const AIResourceContextCollector: React.FC<{
  uid: string;
}> = (props) => {
  const { uid } = props;
  const service = useResourceActionContext();

  useEffect(() => {
    if (uid !== 'collections:list' || typeof service?.refresh !== 'function') {
      return;
    }
    return registerDataModelingRefreshHandler(() => service.refresh());
  }, [uid, service]);

  return null;
};
