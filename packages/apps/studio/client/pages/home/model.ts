/**
 * What the home page's composer decides before anything is sent: which agent it starts with and why it cannot send
 * yet. Pure, so the rules are tested without a browser.
 *
 * The composer's agent picker lists every enabled agent the person may chat with. The page starts with the person's
 * own default agent, else the team's default, else the first agent that can answer now, else the first at all.
 */
import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';

/** The agent the composer starts with; null when the person may chat with none. */
export function defaultAgent(agents: readonly ChatAgent[]): ChatAgent | null {
  return (
    agents.find((agent) => agent.isMyDefault) ??
    agents.find((agent) => agent.isSystemDefault) ??
    agents.find((agent) => agent.availability.online) ??
    agents[0] ??
    null
  );
}

/** The agent picked, while it is still listed; else the default. */
export function chosenAgent(
  agents: readonly ChatAgent[],
  picked: string | null,
): ChatAgent | null {
  return (
    (picked ? agents.find((agent) => agent.id === picked) : undefined) ??
    defaultAgent(agents)
  );
}

/**
 * Why the chosen agent cannot be written to now, for the note under the composer: `noAgent` (the person may chat with
 * no agent), `unavailable` (it is not enabled, deleted or forbidden to the person), or null when it can. An agent with
 * no runner online is not blocked: the message waits for one.
 */
export function agentBlocker(
  agent: ChatAgent | null,
): 'noAgent' | 'unavailable' | null {
  if (!agent) return 'noAgent';
  const reason = agent.availability.reason;
  if (
    reason === 'agentMissing' ||
    reason === 'agentArchived' ||
    reason === 'forbidden'
  )
    return 'unavailable';
  return null;
}

/** The text a message is sent with: trimmed, and nothing when it is empty. */
export function messageOf(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

/** Where the install script is served, below the application's address. */
const INSTALL_SCRIPT_PATH = '/api/agents/dist/installScript';

/** The one-line install of the nb-studio CLI with a download token; the script knows the server it came from. */
export function cliInstallLine(server: string, token: string): string {
  return `curl -fsSL ${server}${INSTALL_SCRIPT_PATH} | sh -s -- --token ${token}`;
}

/**
 * The prompt a person pastes into their coding agent: install the CLI, sign in once they confirm the code, then learn
 * the commands and use them rather than the HTTP API. Computer setup appends connection instructions to the same common text. Interpolated without escaping: it is copied, never rendered as
 * HTML.
 */
export function agentSetupPrompt(
  t: (key: string, options: Record<string, unknown>) => string,
  server: string,
  token: string,
  { purpose = 'local' }: { readonly purpose?: 'local' | 'computer' } = {},
): string {
  const options = {
    server,
    install: cliInstallLine(server, token),
    interpolation: { escapeValue: false },
  };
  const common = t('home.agentSetup.prompt', options);
  return purpose === 'computer'
    ? `${common}\n${t('home.agentSetup.computerPrompt', options)}`
    : common;
}
