/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UseRequestResult } from '@nocobase/client';
import { createContext, useContext } from 'react';
import { BackupFile } from './components/BackupsTable';

export const BackupsContext = createContext<UseRequestResult<{ data: BackupFile[] }> | null>(null);

export const useBackupsContext = () => {
  const context = useContext(BackupsContext);

  if (!context) {
    throw new Error('BackupsContext provider is missing');
  }

  return context;
};
