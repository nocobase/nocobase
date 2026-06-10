/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, Radio } from 'antd';
import React from 'react';
import { useWorkflowTranslation } from '../../locale';

// Inlined (not imported from the v1 `triggers/schedule/constants`, which transitively pulls `@nocobase/client` through
// the v1 locale module).
const SCHEDULE_MODE = {
  STATIC: 0,
  DATE_FIELD: 1,
};

export default function ScheduleTriggerConfigForm() {
  const { t } = useWorkflowTranslation();
  const options = [
    { value: SCHEDULE_MODE.STATIC, label: t('Based on certain date') },
    { value: SCHEDULE_MODE.DATE_FIELD, label: t('Based on date field of collection') },
  ];
  return (
    <Form.Item
      name={['config', 'mode']}
      label={t('Trigger mode')}
      rules={[{ required: true }]}
      initialValue={SCHEDULE_MODE.STATIC}
    >
      <Radio.Group options={options} />
    </Form.Item>
  );
}
