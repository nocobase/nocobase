/**
 * The brief an agent runs with, as people read it: the four layers the server renders (rules, task, context, the
 * agent's own instructions) and the first turn. The runner adds what only it knows where the system prompt holds its
 * placeholders (`{{runner.workspaceNotes}}`, `{{runner.workspaceInit}}`).
 */

export interface BriefLayers {
  readonly system: string;
  readonly task: string;
  readonly context: string;
  readonly agent: string;
}

/** A made-up value in a previewed brief, marked so nobody mistakes it for data. */
export function sampleValue(text: string): string {
  return `[sample] ${text}`;
}

/**
 * `GET /api/agents/:agentId/previewBrief?scenario=`: what a run of the agent on a made-up subject of the scenario's kind
 * would be sent now (`SubjectSample`), the made-up values marked with `sampleValue`.
 */
export interface BriefPreview {
  /** The subject kind the brief was rendered for (for example, `issue` or `conversation`). */
  readonly scenario: string;
  /** The made-up subject. */
  readonly subject: { readonly key: string; readonly title: string | null };
  /**
   * The system prompt as the runner or the online executor receives it is `platform` followed by `agentPrompt`.
   * `platform` is everything before the agent's own prompt: the rules, the task, the context and the English lead-in to
   * the agent's prompt. The runner's placeholders are shown annotated.
   */
  readonly platform: string;
  /** The agent's own prompt as written, which ends the system prompt; empty when the agent has none. */
  readonly agentPrompt: string;
  /** The first message: the turn the agent is given, with what woke it. */
  readonly firstMessage: string;
}

/** `GET /api/agents/runs/:runId/brief`: the brief the run's latest attempt was given. */
export interface RunBrief {
  readonly runId: string;
  readonly attempt: number;
  readonly layers: BriefLayers;
  readonly turn: string;
  readonly prompt: string;
  readonly createdAt: string;
}
