/**
 * The panel's launchers, small enough for the plugin's eager entry: they reach the panel only through `useChatPanel()`
 * and never import `client/panel/`, which loads the first time the panel opens.
 */
export {
  AgentHeaderButton,
  type AgentHeaderButtonProps,
} from './agent-header-button.js';
export {
  AskAgentButton,
  type AskAgentButtonProps,
} from './ask-agent-button.js';
