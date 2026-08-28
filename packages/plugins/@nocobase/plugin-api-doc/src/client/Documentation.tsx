/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useCurrentAppInfo } from '@nocobase/client';
import React from 'react';
import DocumentationContent from '../client-v2/pages/DocumentationContent';
import { useTranslation } from '../locale';

const Documentation = () => {
  const apiClient = useAPIClient();
  const appInfo = useCurrentAppInfo();
  const { t } = useTranslation();

  return <DocumentationContent apiClient={apiClient} appName={appInfo?.data?.name} t={t} />;
};

export default Documentation;
