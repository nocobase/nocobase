/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useForm } from '@formily/react';
import { ArrayField as ArrayFieldModel } from '@formily/core';
import { ArrayItems } from '@formily/antd-v5';
import { Button, Popover, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import React, { useCallback, useState } from 'react';
import { useNotificationTranslation } from '../../../../locale';

export default function UsersAddition() {
  const [open, setOpen] = useState(false);
  const { t } = useNotificationTranslation();
  const array = ArrayItems.useArray();
  const form = useForm();
  const disabled = form?.disabled === true;

  const onAddSelect = useCallback(() => {
    array.field.push('');
    setOpen(false);
  }, [array.field]);

  const onAddQuery = useCallback(() => {
    array.field.push({ filter: {} });
    setOpen(false);
  }, [array.field]);

  const button = (
    <Button icon={<PlusOutlined />} type="dashed" block disabled={disabled} className="ant-formily-array-base-addition">
      {t('Add user')}
    </Button>
  );

  return disabled ? (
    button
  ) : (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <Space direction="vertical" size="small">
          <Button type="text" onClick={onAddSelect}>
            {t('Select users')}
          </Button>
          <Button type="text" onClick={onAddQuery}>
            {t('Query users')}
          </Button>
        </Space>
      }
    >
      {button}
    </Popover>
  );
}
