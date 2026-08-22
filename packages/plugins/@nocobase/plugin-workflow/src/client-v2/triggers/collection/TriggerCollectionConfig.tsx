/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form } from 'antd';
import React from 'react';
import { TriggerCollectionRecordSelect } from '../../components/collection';
import { useT } from '../../locale';

export function TriggerCollectionConfig() {
  const t = useT();

  return (
    <Form.Item
      name="data"
      label={t('Trigger data')}
      extra={t('Choose a record or primary key of a record in the collection to trigger.')}
      rules={[{ required: true }]}
    >
      <TriggerCollectionRecordSelect />
    </Form.Item>
  );
}

export default TriggerCollectionConfig;
