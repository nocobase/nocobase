/**
 * Where an App comes from, as the assembling application knows it: the plugin knows Apps and environments only, so an
 * application that builds Apps from something of its own (a repository, say) may provide `ReleasesAppOriginContext`
 * with a component the App's Overview renders under its details, and a one-line `Summary` that lists and the App's
 * header show in place of the labels it added (`ReleasesSystemLabelsContext`), such as "PR #18 · acme/crm". Each
 * renders nothing for an App it does not know. Without the context the pages show nothing more.
 */
import { createContext, type ComponentType, type Context } from 'react';

import type { Labels } from '../../shared/releases.js';

export interface AppOriginProps {
  readonly appId: string;
}

export interface AppOriginSummaryProps {
  readonly appId: string;
  readonly labels: Labels;
}

export interface AppOrigin {
  readonly Origin: ComponentType<AppOriginProps>;
  readonly Summary?: ComponentType<AppOriginSummaryProps>;
}

export const ReleasesAppOriginContext: Context<AppOrigin | null> =
  createContext<AppOrigin | null>(null);
