import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  AI_SETTINGS,
  AI_SETTINGS_ACTIONS,
  AI_SETTINGS_RESOURCE_TYPE,
  type AISettingsKey,
} from '../../shared/authorization.js';

const ns = '@nocobase/app-plugin-ai-employee';

/** The System management subsection the AI settings items are listed in. */
export const AI_SETTINGS_SECTION = 'ai';

/** Registers the AI settings items and lists them, one per settings page, under System management → AI. */
export function registerAISettings(authz: AppAuthorization): void {
  authz.ui.sections.add({
    name: AI_SETTINGS_SECTION,
    title: { key: 'authorization.section', ns },
    parent: 'administration',
  });
  for (const [order, key] of (
    Object.keys(AI_SETTINGS) as AISettingsKey[]
  ).entries()) {
    authz.settings.add({
      id: AI_SETTINGS[key],
      title: { key: `authorization.items.${key}`, ns },
      actions: AI_SETTINGS_ACTIONS[key].map((name) => ({
        name,
        title: { key: `authorization.actions.${name}`, ns },
      })),
    });
    authz.ui.place(
      { type: AI_SETTINGS_RESOURCE_TYPE, id: AI_SETTINGS[key] },
      { section: AI_SETTINGS_SECTION, order },
    );
  }
}

export class AIEmployeeAuthorizationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-ai-employee/authorization';

  public override async boot(): Promise<void> {
    registerAISettings(this.app.container.resolve(authorizationToken));
  }
}
