// The agent sessions in a host application's own panel, beside whatever page is open, and the sessions tied to a
// record, for the host to offer where that record shows.
export {
  AgentSessionsPanel,
  type AgentSessionsPanelAttach,
  type AgentSessionsPanelProps,
  type AgentSessionsPanelView,
} from './components/sessions-panel.js';
export type { Attachment } from './lib/attachments.js';
export { useLinkedSessions, useAgentSessionAvailability } from './api.js';
