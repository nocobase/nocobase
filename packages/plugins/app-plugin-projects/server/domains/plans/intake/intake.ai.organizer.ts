/**
 * Who organises requirement intake with AI (`shared/intake-ai.ts`): the application binds one through
 * `projectsIntakeOrganizerToken`. The plugin hands it each job's task and asks it how the job goes; the organiser
 * answers asynchronously through `IntakeAiService.deliver` (the drafts) or `ended` (it gave up). an application's organiser runs
 * an agent on a runner; a built-in model runtime would call the model and deliver the same way.
 */
import type {
  IntakeAiProgress,
  IntakeAiTask,
} from '../../../../shared/intake-ai.js';

/** Whether a person can ask now. */
export interface OrganizerAvailability {
  readonly available: boolean;
  /** Why not, a key the application words (`noAgent`). */
  readonly reason?: string | null;
  /** Who would organise (an agent's name). */
  readonly by?: string | null;
  /** It cannot start right now (no runtime online); a request waits. */
  readonly waits?: boolean;
}

/** A job as the organiser knows it: the job's id and the reference `start` answered. */
export interface OrganizerJobRef {
  readonly jobId: string;
  readonly ref: string | null;
  readonly userId: string;
}

/** How a job goes: in progress, ended without a delivery (`ended`), or unknown (null). */
export type OrganizerProgress =
  | IntakeAiProgress
  | { readonly ended: { readonly code: string; readonly message: string } }
  | null;

export interface IntakeOrganizer {
  availability(userId: string): Promise<OrganizerAvailability>;
  /**
   * Starts work on the task, as the person who asked; answers a reference to it (for example, the run) and who works on
   * it. Throwing refuses the request (`AI_UNAVAILABLE`, with the error's message).
   */
  start(
    task: IntakeAiTask,
  ): Promise<{ readonly ref: string | null; readonly by: string | null }>;
  progress(job: OrganizerJobRef): Promise<OrganizerProgress>;
  /** The person cancelled the job: stop the work. */
  cancel(job: OrganizerJobRef, byUserId: string): Promise<void>;
}
