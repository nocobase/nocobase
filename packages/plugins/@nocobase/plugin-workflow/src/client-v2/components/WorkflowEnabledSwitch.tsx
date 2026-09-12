/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemoizedFn } from 'ahooks';
import { App, Switch } from 'antd';
import React, { useState } from 'react';
import { useWorkflowTranslation } from '../locale';
import type { WorkflowCanvasRecord } from './workflowCanvas';

export function WorkflowEnabledSwitch({
  record,
  resource,
  onChanged,
}: {
  record: WorkflowCanvasRecord;
  resource: any;
  onChanged: (enabled: boolean) => void;
}) {
  const { t } = useWorkflowTranslation();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const onChange = useMemoizedFn(async (checked: boolean) => {
    setLoading(true);
    try {
      await resource.update({ filterByTk: record.id, values: { enabled: checked } });
      onChanged(checked);
    } catch (error) {
      message.error(t('Operation failed'));
    } finally {
      setLoading(false);
    }
  });
  return (
    <Switch
      checked={Boolean(record.enabled)}
      loading={loading}
      onChange={onChange}
      checkedChildren={t('On')}
      unCheckedChildren={t('Off')}
    />
  );
}

export default WorkflowEnabledSwitch;
