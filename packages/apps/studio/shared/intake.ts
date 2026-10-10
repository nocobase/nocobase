/**
 * Requirement intake's "Let an agent organize", as the browser and Studio's API exchange it:
 * `POST /api/organizeIntake` (signed in) takes `OrganizeRequest` and answers the first message of the conversation it
 * starts (`{ data: SendMessageResult }`, the agents plugin's). Studio wraps the text and the files' text, marked as data,
 * in a request to turn them into an operation plan of new issues; the whole message is at most the agents plugin's
 * `MESSAGE_CONTENT_MAX` characters (400 `INTAKE_TOO_LONG` otherwise).
 */

import type { ChatAvailability } from '@nocobase/app-plugin-agents/shared/conversations';

export type IntakeUnavailableReason =
  | 'INTAKE_NO_AGENT'
  | 'INTAKE_MODEL_MISSING'
  | 'INTAKE_MODEL_UNAVAILABLE'
  | 'INTAKE_NO_RUNNER'
  | 'INTAKE_AGENT_UNAVAILABLE';

/** Refusal before a handoff, also checked after submission for availability races. */
export function intakeUnavailableReason(
  agent:
    | {
        readonly models: readonly unknown[];
        readonly availability: ChatAvailability;
      }
    | undefined,
): IntakeUnavailableReason | null {
  if (!agent) return 'INTAKE_NO_AGENT';
  if (agent.availability.online) return null;
  if (agent.availability.reason === 'modelUnavailable')
    return agent.models.length === 0
      ? 'INTAKE_MODEL_MISSING'
      : 'INTAKE_MODEL_UNAVAILABLE';
  if (agent.availability.reason === 'noRunner') return 'INTAKE_NO_RUNNER';
  return 'INTAKE_AGENT_UNAVAILABLE';
}

/** Files a request takes at most. */
export const INTAKE_FILES_MAX = 10;
/** The longest text of one file, in characters. */
export const INTAKE_FILE_TEXT_MAX = 50_000;

export const INTAKE_ROUTE = 'organizeIntake';

export interface OrganizeRequest {
  /** The raw description, meeting notes or CSV. */
  readonly text: string;
  /** The conversation's title; `Organize: <first words>` by default. */
  readonly title?: string;
  /** The agent to ask; the person's default, else the system default, otherwise. */
  readonly agentId?: string;
  /** The project the new issues go to. */
  readonly projectId?: string;
  /** Text the page extracted from uploaded files. */
  readonly files?: readonly { readonly name: string; readonly text: string }[];
  readonly clientId?: string;
}
