/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCurrentAppInfo } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import React from 'react';
import { useT } from '../locale';
import DocumentationContent from './DocumentationContent';

type AppInfo = {
  data?: {
    name?: string;
  };
};

const Documentation = () => {
  const { api } = useFlowContext();
  const appInfo = useCurrentAppInfo<AppInfo>();
  const t = useT();

  return <DocumentationContent apiClient={api} appName={appInfo?.data?.name} t={t} />;
};

export default Documentation;
