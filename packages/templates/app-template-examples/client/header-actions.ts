import {
  defineHeaderActionOverrides,
  defineHeaderActions,
  type AppClientHeaderActionDefinition,
  type AppClientHeaderActionOverride,
} from '@nocobase/app-client/plugins';

import { ChatHeaderButton } from '#extensions/nocobase-agent-chat/launchers';

/**
 * The application's own buttons in the header, left of the account menu, beside those its plugins register. Each is
 * `{ name, order, component, auth?, badge? }`; lower `order` goes further left.
 */
export const headerActions: readonly AppClientHeaderActionDefinition[] =
  defineHeaderActions([
    // Examples-only integration: the Agent chat opens from the header beside the account menu. It renders nothing
    // when no chat is available to the viewer.
    { name: 'agent-chat', order: 900, component: ChatHeaderButton },
  ]);

/**
 * Hides or replaces a button someone registered, by its name: `{ name: 'inbox', hidden: true }`, or
 * `{ name: 'inbox', component: MyInboxButton }`.
 */
export const headerActionOverrides: readonly AppClientHeaderActionOverride[] =
  defineHeaderActionOverrides([]);
