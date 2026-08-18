/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import type { JsTemplateProject, JsTemplateSyncSourceSummary } from '../../../shared/types';
import JsTemplateSyncDrawer from '../../components/JsTemplateSyncDrawer';

interface JsTemplateSyncDrawerShellProps {
  configurationPanel: React.ReactNode;
  onClose: () => void;
  onProjectUpdated: (project: JsTemplateProject) => void;
  onSyncSourceChanged: (source: JsTemplateSyncSourceSummary | null) => void;
  open: boolean;
  project: JsTemplateProject | null;
  version: number;
}

export function JsTemplateSyncDrawerShell({
  configurationPanel,
  onClose,
  onProjectUpdated,
  onSyncSourceChanged,
  open,
  project,
  version,
}: JsTemplateSyncDrawerShellProps) {
  if (!project) {
    return null;
  }

  return (
    <JsTemplateSyncDrawer
      configurationPanel={configurationPanel}
      key={`${project.id}:${version}`}
      onClose={onClose}
      onProjectUpdated={onProjectUpdated}
      onSyncSourceChanged={onSyncSourceChanged}
      open={open}
      project={project}
    />
  );
}
