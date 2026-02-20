/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Switch, App } from 'antd';
import { useField } from '@formily/react';
import { Field } from '@formily/core';
import { useCollectionRecordData, useDataBlockRequest, useDataBlockResource } from '@nocobase/client';
import { useT } from '../../locale';
import { useAIEmployeesData } from '../hooks/useAIEmployeesData';

export const EnableSwitch: React.FC = () => {
  const field = useField<Field>();
  const record = useCollectionRecordData();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const { refresh: refreshAIEmployees } = useAIEmployeesData();
  const { message } = App.useApp();
  const t = useT();
  const [loading, setLoading] = useState(false);

  const handleChange = async (checked: boolean) => {
    setLoading(true);
    try {
      await resource.update({
        filterByTk: record.username,
        values: { enabled: checked },
      });
      message.success(t('Saved successfully'));
      refresh();
      refreshAIEmployees();
    } catch (error) {
      message.error(t('Failed to update'));
    } finally {
      setLoading(false);
    }
  };

  return <Switch checked={field.value} onChange={handleChange} loading={loading} size="small" />;
};
