/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Popover } from 'antd';
import { HelperConfiguator } from './HelperConfiguator';

const WithPropOver = ({ children, index }) => {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };
  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      content={<HelperConfiguator index={index} onDelete={() => setOpen(false)} />}
      trigger={'click'}
    >
      {children}
    </Popover>
  );
};

export function Helper({ configurable, index, label }: { configurable: boolean; index: number; label: string }) {
  const Label = <div style={{ color: '#52c41a', display: 'inline-block', cursor: 'pointer' }}>{label}</div>;
  return (
    <>
      <span style={{ color: '#bfbfbf', margin: '0 5px' }}>|</span>
      {configurable ? <WithPropOver index={index}>{Label}</WithPropOver> : Label}
    </>
  );
}
