/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { Button, Popover, Space } from 'antd';
import React, { useCallback, useState } from 'react';
import { useNotificationTranslation } from '../../locale';

export type UserAdditionProps = {
  value?: Array<number | string | { filter?: Record<string, unknown> }>;
  onChange?: (next: Array<number | string | { filter?: Record<string, unknown> }>) => void;
  disabled?: boolean;
};

export function UserAddition(props: UserAdditionProps) {
  const { value = [], onChange, disabled } = props;
  const { t } = useNotificationTranslation();
  const [open, setOpen] = useState(false);

  const append = useCallback(
    (item: string | { filter?: Record<string, unknown> }) => {
      onChange?.([...value, item]);
      setOpen(false);
    },
    [onChange, value],
  );

  const button = (
    <Button icon={<PlusOutlined />} type="dashed" block disabled={disabled}>
      {t('Add user')}
    </Button>
  );

  if (disabled) {
    return button;
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <Space direction="vertical" size="small">
          <Button type="text" onClick={() => append('')}>
            {t('Select users')}
          </Button>
          <Button type="text" onClick={() => append({ filter: {} })}>
            {t('Query users')}
          </Button>
        </Space>
      }
    >
      {button}
    </Popover>
  );
}

export default UserAddition;
