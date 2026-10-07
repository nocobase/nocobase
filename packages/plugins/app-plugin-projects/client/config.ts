/**
 * The settings pages, for the application to route under its `/config` (the plugin has no settings route of its own):
 * the issue prefix, labels and workflows. Each is bound to this plugin's namespace, since it renders in the
 * application's.
 */
import { withNamespace } from '@nocobase/i18n/client';
import type { ComponentType } from 'react';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import GeneralPage from './pages/config/general.js';
import LabelsPage from './pages/config/labels.js';
import WorkflowDetailPage from './pages/config/workflow-detail.js';
import WorkflowsPage from './pages/config/workflows.js';

export const GeneralSettings: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  GeneralPage,
);
export const LabelsSettings: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  LabelsPage,
);
export const WorkflowsSettings: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  WorkflowsPage,
);
export const WorkflowSettings: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  WorkflowDetailPage,
);
