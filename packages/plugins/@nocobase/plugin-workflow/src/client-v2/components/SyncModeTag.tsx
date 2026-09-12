/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tag } from 'antd';
import React from 'react';
import { useWorkflowTranslation } from '../locale';

export function SyncModeTag({ value }: { value?: boolean | null }) {
  const { t } = useWorkflowTranslation();
  return value ? <Tag color="orange">{t('Synchronously')}</Tag> : <Tag color="cyan">{t('Asynchronously')}</Tag>;
}

export default SyncModeTag;
