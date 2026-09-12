/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';
import type { BackupFile } from './components/BackupsTable';

export type BackupsListBody = {
  data: BackupFile[];
};

export type BackupsContextValue = {
  data?: BackupsListBody;
  loading: boolean;
  refresh: () => void;
  refreshAsync: () => Promise<BackupsListBody>;
};

export const BackupsContext = createContext<BackupsContextValue | null>(null);

export const useBackupsContext = () => {
  const context = useContext(BackupsContext);

  if (!context) {
    throw new Error('BackupsContext provider is missing');
  }

  return context;
};
