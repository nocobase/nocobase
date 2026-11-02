import type { ServiceResolver } from '@nocobase/service-provider';

import { demoModeServiceToken } from './tokens.js';

/** The subset needed by mode checks, including containers without this plugin. */
export type DemoModeContainer = Pick<ServiceResolver, 'has' | 'resolve'>;

export function isDemoMode(container: DemoModeContainer): boolean {
  return (
    container.has(demoModeServiceToken) &&
    container.resolve(demoModeServiceToken).enabled === true
  );
}
