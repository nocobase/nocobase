/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import type { LightExtensionRepoRecord, LightExtensionSyncSourceSummary } from '../../../shared/types';
import LightExtensionSyncDrawer from '../../components/LightExtensionSyncDrawer';

interface LightExtensionSyncDrawerShellProps {
  configurationPanel: React.ReactNode;
  onClose: () => void;
  onRepoUpdated: (repo: LightExtensionRepoRecord) => void;
  onSyncSourceChanged: (source: LightExtensionSyncSourceSummary | null) => void;
  open: boolean;
  repo: LightExtensionRepoRecord | null;
  version: number;
}

export function LightExtensionSyncDrawerShell({
  configurationPanel,
  onClose,
  onRepoUpdated,
  onSyncSourceChanged,
  open,
  repo,
  version,
}: LightExtensionSyncDrawerShellProps) {
  if (!repo) {
    return null;
  }

  return (
    <LightExtensionSyncDrawer
      configurationPanel={configurationPanel}
      key={`${repo.id}:${version}`}
      onClose={onClose}
      onRepoUpdated={onRepoUpdated}
      onSyncSourceChanged={onSyncSourceChanged}
      open={open}
      repo={repo}
    />
  );
}
