/**
 * What the agents plugin adds to the person's preferences: "My default chat agent" (`DefaultAgentPreference`). The
 * application places it (for example, `client/pages/account/preferences.tsx`); it brings this plugin's translations and
 * query cache.
 */
import type { ComponentType } from 'react';

import { DefaultAgentPreference as BaseField } from './profile/default-agent.js';
import { withAgents } from './query.js';

export const DefaultAgentPreference: ComponentType = withAgents(BaseField);
