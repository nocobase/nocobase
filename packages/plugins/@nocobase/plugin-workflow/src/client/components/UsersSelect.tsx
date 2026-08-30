/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { ArrayItems } from '@formily/antd-v5';
import { UsersSelect as UsersSelectV2 } from '../../client-v2/components/UsersSelect';
import { Button, Popover, Space } from 'antd';
import React, { useCallback, useState } from 'react';
import { useWorkflowExecuted } from '../hooks';
import { lang } from '../locale';

export const UsersSelect = UsersSelectV2;

export function UsersAddition() {
  const executed = useWorkflowExecuted();
  const array = ArrayItems.useArray();
  const [open, setOpen] = useState(false);
  const onAddSelect = useCallback(() => {
    array.field.push(null);
    setOpen(false);
  }, [array.field]);
  const onAddQuery = useCallback(() => {
    array.field.push({ filter: {} });
    setOpen(false);
  }, [array.field]);

  const button = (
    <Button
      icon={<PlusOutlined />}
      type="dashed"
      block
      disabled={executed > 0}
      className="ant-formily-array-base-addition"
    >
      {lang('Add')}
    </Button>
  );

  return executed > 0 ? (
    button
  ) : (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
      content={
        <Space direction="vertical" size="small">
          <Button type="text" onClick={onAddSelect}>
            {lang('Select users')}
          </Button>
          <Button type="text" onClick={onAddQuery}>
            {lang('Query users')}
          </Button>
        </Space>
      }
    >
      {button}
    </Popover>
  );
}
