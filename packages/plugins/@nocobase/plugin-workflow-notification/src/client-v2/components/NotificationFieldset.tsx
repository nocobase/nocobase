/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { MessageConfigForm } from '@nocobase/plugin-notification-manager/client-v2';
import { useWorkflowVariableOptions } from '@nocobase/plugin-workflow/client-v2';
import { Checkbox, Form } from 'antd';
import { useT } from '../locale';

export function NotificationFieldset() {
  const t = useT();
  const variableOptions = useWorkflowVariableOptions();

  return (
    <>
      <MessageConfigForm namePrefix={['config']} variableOptions={variableOptions} />
      <Form.Item name={['config', 'ignoreFail']} valuePropName="checked">
        <Checkbox>{t('Ignore failure and continue workflow')}</Checkbox>
      </Form.Item>
    </>
  );
}

export default NotificationFieldset;
