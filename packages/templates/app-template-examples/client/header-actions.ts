import {
  defineHeaderActionOverrides,
  defineHeaderActions,
  type AppClientHeaderActionDefinition,
  type AppClientHeaderActionOverride,
} from '@nocobase/app-client/plugins';

import { SystemSettingsButton } from './layouts/components/system-settings-button.js';

/**
 * The application's own buttons in the header, left of the account menu, beside those its plugins register. Each is
 * `{ name, order, component, auth?, badge? }`; lower `order` goes further left.
 */
export const headerActions: readonly AppClientHeaderActionDefinition[] =
  defineHeaderActions([
    {
      name: 'system-settings',
      routeId: 'app:settingsHome',
      placement: 'beforeAccount',
      component: SystemSettingsButton,
    },
  ]);

/**
 * Hides or replaces a button someone registered, by its name: `{ name: 'inbox', hidden: true }`, or
 * `{ name: 'inbox', component: MyInboxButton }`.
 */
export const headerActionOverrides: readonly AppClientHeaderActionOverride[] =
  defineHeaderActionOverrides([]);
