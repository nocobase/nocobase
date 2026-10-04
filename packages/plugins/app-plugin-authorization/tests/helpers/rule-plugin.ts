import type { AuthorizationPlugin } from '@nocobase/authorization/core';
import {
  createRouteHandler,
  createRuleSupportRoutes,
  type AuthorizationExtensionHost,
} from '../../server/extension/index.js';
import {
  AUTHORIZATION_SETTINGS_SECTION,
  type DatabaseAuthorizationApi,
  type SettingsAuthorizationApi,
  type UiAuthorizationApi,
} from '../../server/index.js';

/**
 * A rule plugin reduced to what the rule packages register through this
 * plugin: a settings item `authorization.<rule>` placed in the Authorization
 * subsection and the support routes under the rule's camelCase path, such as
 * `/sharingRules` for `sharing-rules`.
 */
export function testRulePlugin(
  rule: string,
): AuthorizationPlugin<
  object,
  unknown,
  SettingsAuthorizationApi & DatabaseAuthorizationApi & UiAuthorizationApi
> {
  return {
    id: `test-${rule}`,
    dependencies: ['settings', 'database', 'ui'],
    setup(authz) {
      const id = `authorization.${rule}`;
      authz.settings.add({
        id,
        title: rule,
        actions: ['read', 'create', 'update', 'delete'].map((name) => ({
          name,
        })),
      });
      authz.ui.place(
        { type: 'settings', id },
        { section: AUTHORIZATION_SETTINGS_SECTION },
      );
      const path = rulePath(rule);
      authz.routes.add(
        path,
        createRouteHandler(
          createRuleSupportRoutes(
            authz as unknown as AuthorizationExtensionHost,
            { path, settings: id },
          ),
        ),
      );
    },
  };
}

/** The route prefix of a rule: `sharing-rules` is served at `/sharingRules`. */
export function rulePath(rule: string): string {
  return `/${rule.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())}`;
}
