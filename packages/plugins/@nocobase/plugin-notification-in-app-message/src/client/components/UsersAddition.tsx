/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import { ArrayField as ArrayFieldModel } from '@formily/core';
import { Button, Popover, Radio, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import React, { useCallback, useState } from 'react';
import { useWorkflowExecuted } from '@nocobase/plugin-workflow/client';
import { useLocalTranslation } from '../../locale';

export function UsersAddition() {
  const executed = useWorkflowExecuted();
  /*
      waiting for improvement
      const array = ArrayItems.useArray();
  */
  const [open, setOpen] = useState(false);
  const { t } = useLocalTranslation();
  const field = useField<ArrayFieldModel>();
  /*
      waiting for improvement
      const array = ArrayItems.useArray();
  */
  const { receivers } = field.form.values;
  const onAddSelect = useCallback(() => {
    receivers.push('');
    setOpen(false);
  }, [receivers]);
  const onAddQuery = useCallback(() => {
    receivers.push({ filter: {} });
    setOpen(false);
  }, [receivers]);

  const button = (
    <Button
      icon={<PlusOutlined />}
      type="dashed"
      block
      disabled={executed > 0}
      className="ant-formily-array-base-addition"
    >
      {t('Add user')}
    </Button>
  );

  return executed ? (
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
