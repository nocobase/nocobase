// The plugin's public client surface. The default export is the registration factory an application lists in its
// client/plugins.ts, with the extension points on it (`agents.toolRenderers`, `agents.slots`, `agents.components`,
// `agents.preferenceSections`).
export { default, type AgentsClientOptions } from './plugin.js';
export {
  AskAgentButton,
  AgentHeaderButton,
  type AskAgentButtonProps,
  type AgentHeaderButtonProps,
} from './launchers/index.js';
export { useAgentContext, type AgentContextOptions } from './shell/context.js';
export { useAgentAttention } from './shell/attention.js';
export {
  AGENT_COMPONENT_NAMES,
  AGENT_SLOT_NAMES,
  agentsUi,
  type AgentComponentName,
  type AgentComponentReplacement,
  type AgentComponents,
  type AgentPreferenceSectionRegistration,
  type AgentPreferenceSections,
  type AgentSlot,
  type AgentSlotName,
  type AgentSlotProps,
  type AgentSlotRegistration,
  type AgentSlots,
  type AgentToolRendererRegistration,
  type AgentToolRenderers,
  type AgentsUi,
} from './ui-registry.js';
