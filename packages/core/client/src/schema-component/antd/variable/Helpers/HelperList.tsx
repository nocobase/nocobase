/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { Tag } from 'antd';
import React from 'react';
import { useHelperObservables } from './hooks/useHelperObservables';

export const HelperList = observer(() => {
  const helperObservables = useHelperObservables();
  const { helpersObs, removeHelper } = helperObservables;

  return (
    <>
      {helpersObs.value.map((helper, index) => (
        <Tag key={helper.name} closable onClose={() => removeHelper({ index })}>
          {helper.name}
        </Tag>
      ))}
    </>
  );
});
