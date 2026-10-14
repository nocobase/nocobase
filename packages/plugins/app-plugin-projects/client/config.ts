/**
 * The settings pages, for the application to route under its `/config` (the plugin has no settings route of its own):
 * the issue prefix and labels. Each is bound to this plugin's namespace, since it renders in the
 * application's.
 */
import { withNamespace } from '@nocobase/i18n/client';
import type { ComponentType } from 'react';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import GeneralPage from './pages/config/general.js';
import LabelsPage from './pages/config/labels.js';

export const GeneralSettings: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  GeneralPage,
);
export const LabelsSettings: ComponentType = withNamespace(
  ACCESS_NAMESPACE,
  LabelsPage,
);
