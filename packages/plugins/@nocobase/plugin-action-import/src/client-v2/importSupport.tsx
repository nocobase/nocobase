/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from './locale';

export const initImportSettings = (fields) => {
  const importColumns = fields
    ?.filter((field) => !field.children && !field.disabled)
    .map((field) => ({ dataIndex: [field.name] }));
  return { importColumns, explain: '' };
};

export const ImportWarning = () => {
  const { t } = useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
  return <Alert type="warning" style={{ marginBottom: '10px' }} message={t('Import warnings', { limit: 2000 })} />;
};

export const DownloadTips = () => {
  const { t } = useTranslation([NAMESPACE, 'client'], { nsMode: 'fallback' });
  return <Alert type="info" style={{ marginBottom: '10px', whiteSpace: 'pre-line' }} message={t('Download tips')} />;
};
