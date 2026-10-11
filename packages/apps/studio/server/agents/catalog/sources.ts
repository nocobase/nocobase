/**
 * Where Studio's pages start conversations besides the chat panel: an "Ask agent" button (`askAgent`) and requirement
 * intake's "Let an agent organize" (`intake`).
 */
import type { ConversationSourceKind } from '@nocobase/app-plugin-agents/server/tokens';

import { STUDIO_NAMESPACE } from '../../../shared/access.js';

export const ASK_AGENT_SOURCE = 'askAgent';
export const INTAKE_SOURCE = 'intake';

export const CONVERSATION_SOURCES: readonly ConversationSourceKind[] = [
  {
    key: ASK_AGENT_SOURCE,
    title: { key: 'studioAgents.sources.askAgent', ns: STUDIO_NAMESPACE },
  },
  {
    key: INTAKE_SOURCE,
    title: { key: 'studioAgents.sources.intake', ns: STUDIO_NAMESPACE },
  },
];
