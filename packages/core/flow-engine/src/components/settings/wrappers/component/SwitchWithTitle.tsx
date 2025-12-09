/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, Dropdown, Modal, Switch } from 'antd';
import React, { FC } from 'react';
import { observer } from '@formily/react';

const ml32 = { marginLeft: 32 };

export const SwitchWithTitle: FC = observer(({ title, defaultValue, onChange }: any) => {
  return (
    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
      {title}
      <Switch size={'small'} defaultChecked={defaultValue} style={ml32} onChange={onChange} />
    </div>
  );
});
