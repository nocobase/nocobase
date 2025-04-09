/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Popover } from 'antd';
import React, { useState } from 'react';
import { HelperConfiguator } from './HelperConfiguator';

function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}
const WithPropOver = ({ children, index, defaultOpen, title }) => {
  const [open, setOpen] = useState(defaultOpen);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };
  return (
    <Popover
      open={open}
      title={capitalizeFirstLetter(title)}
      onOpenChange={handleOpenChange}
      content={<HelperConfiguator index={index} close={() => setOpen(false)} />}
      trigger={'click'}
    >
      {children}
    </Popover>
  );
};

export function Helper({ index, label, defaultOpen }: { index: number; label: string; defaultOpen: boolean }) {
  const Label = <div style={{ color: '#52c41a', display: 'inline-block', cursor: 'pointer' }}>{label}</div>;
  return (
    <>
      <span style={{ color: '#bfbfbf', margin: '0 5px' }}>|</span>
      <WithPropOver index={index} defaultOpen={defaultOpen} title={label}>
        {Label}
      </WithPropOver>
    </>
  );
}
