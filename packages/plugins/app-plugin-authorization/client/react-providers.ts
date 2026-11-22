import {
  defineClientReactProviders,
  type AppClientReactProviderDefinition,
} from '@nocobase/app-client/plugins';

import { AuthorizationProvider } from './authorization-provider.js';
import { RuleAddressFallback } from './settings/rule-address-fallback.js';

/** The session's permissions, which every page checks against. */
const authorizationProvider: AppClientReactProviderDefinition = {
  name: 'authorization',
  after: ['@nocobase/app-plugin-authentication:authentication'],
  component: AuthorizationProvider,
};

/** Leaves stored links to Data rules whose rule plugin is gone; only with the plugin's pages registered. */
const ruleAddressFallback: AppClientReactProviderDefinition = {
  name: 'rule-address-fallback',
  after: ['@nocobase/app-plugin-authorization:authorization'],
  component: RuleAddressFallback,
};

export const reactProviders: readonly AppClientReactProviderDefinition[] =
  defineClientReactProviders([authorizationProvider, ruleAddressFallback]);

/** The providers of the plugin with its pages registered or, with `routes: false`, without them. */
export function authorizationReactProviders(options: {
  readonly routes?: boolean;
}): readonly AppClientReactProviderDefinition[] {
  return options.routes === false
    ? defineClientReactProviders([authorizationProvider])
    : reactProviders;
}

export default reactProviders;
