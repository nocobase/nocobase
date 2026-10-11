/**
 * Builds as CI reports them (`server/builds`): a build is of one App at one pinned commit, whatever it is deployed for.
 * CI reports it with `nb-studio build status`, makes sure of its App with `nb-studio app ensure`, and uploads and deploys it with
 * `nb-studio deploy --file` (or uploads it alone with `nb-studio release upload`), all with the CI's scoped API key. Studio
 * verifies the commit with the git platform before it records anything: it must belong to the repository (an open pull
 * request's head, on the default branch, tagged, or another branch's head).
 */
import type { CiFailure } from './ci-modes.js';
import type { CiState } from './releases.js';

export const BUILD_STATES = [
  'queued',
  'building',
  'failed',
  'succeeded',
] as const;

export type BuildState = (typeof BUILD_STATES)[number];

/** Where a build's commit came from: an open pull request's head, or a branch or tag (`ref`). */
export const BUILD_SOURCES = ['pullRequest', 'ref'] as const;

export type BuildSource = (typeof BUILD_SOURCES)[number];

export function buildSourceOf(build: {
  readonly pullRequest: boolean;
}): BuildSource {
  return build.pullRequest ? 'pullRequest' : 'ref';
}

/** A full commit hash, as CI pins it. */
export const FULL_SHA = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;

export interface BuildView {
  readonly id: string;
  readonly appId: string;
  readonly sha: string;
  /** The branch or tag it was verified on; null for an open pull request's head. */
  readonly ref: string | null;
  /** It is the head of an open pull request: CI built that pull request. */
  readonly pullRequest: boolean;
  readonly state: BuildState;
  /** Where CI shows its log. */
  readonly logsUrl: string | null;
  readonly message: string | null;
  /** A newer head of its pull request replaced it: it is never deployed. */
  readonly superseded: boolean;
  /** Whether its archive was uploaded, and as which release. */
  readonly releaseId: string | null;
  readonly uploadedAt: string | null;
  /**
   * For a pull request preview's build: the variables its manifest adds and removes against the release the App runs;
   * null when either declares none.
   */
  readonly newVariables: BuildVariablesDiff | null;
  /** When CI reported it; later changes to the build, such as being superseded, leave it as it was. */
  readonly reportedAt: string;
  readonly updatedAt: string;
}

/** What a build's variables manifest changes against the release its App runs. */
export interface BuildVariablesDiff {
  readonly added: readonly {
    readonly name: string;
    readonly description: string | null;
    readonly required: boolean;
    readonly secret: boolean;
  }[];
  readonly removed: readonly string[];
}

/**
 * A repository's CI as Studio set it up (`GET /api/repositoryDeployments/{resourceId}/ci`, `server/builds/ci-setup.ts`):
 * the workflow committed to the default branch (a repository Studio created, before its branch is protected) or proposed
 * in a pull request (any other), and an organization API key limited to the Apps the repository builds, kept as a CI
 * secret of the repository and rotated before it expires. When any of it fails the state is `manual`, with what
 * failed, and the workflow and its key are set up by hand as before.
 */
export interface CiSetupView {
  readonly resourceId: string;
  /** `owner/name` on its host; null for a repository not reached through a Git connection. */
  readonly repo: string | null;
  /** Whether Studio was asked to set the CI up. */
  readonly auto: boolean;
  readonly state: CiState;
  /** The API key the CI uploads with; null before Studio made one. */
  readonly key: CiKeyView | null;
  /** The repository secret holding the key. */
  readonly secretName: string;
  /** What the host calls such a secret (`GitHub Actions secret`); null without a Git connection. */
  readonly secretKind: string | null;
  /** The workflow files Studio writes, one per application. */
  readonly workflowPaths: readonly string[];
  /** The pull request adding or updating the workflow, the last one opened. */
  readonly pullRequest: {
    readonly number: number;
    readonly url: string;
  } | null;
  /** The commit that last wrote the workflow. */
  readonly workflowSha: string | null;
  readonly lastRotatedAt: string | null;
  /** Why the setup, or the last rotation, failed, in English. */
  readonly lastError: string | null;
  /** The same failure by its reason, worded in the reader's language; null for one recorded before reasons were. */
  readonly lastFailure: CiFailure | null;
  /** Whether the viewer may set it up again or rotate the key (they manage the project). */
  readonly canManage: boolean;
}

/**
 * What `POST …/ci/setup` and `POST …/ci/rotate` answer: the setup, and with `reveal` the key's secret, this once. Studio
 * never shows it again; a new one takes another reveal.
 */
export interface CiSetupAnswer extends CiSetupView {
  readonly secret?: string;
}

export interface CiKeyView {
  readonly id: string;
  readonly name: string;
  readonly expiresAt: string | null;
  /** `missing` once the key was deleted. */
  readonly status: 'active' | 'disabled' | 'expired' | 'missing';
}
