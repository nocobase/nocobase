/**
 * How a build of a preview comes to be (`studio.builds.method`). Studio never builds by default: the repository's CI
 * builds every linked App and uploads it (`ci`, Studio only waits for the upload). The runner method (`runner`) is the
 * former preview build job (`runner.ts`): a runner whose owner allowed build jobs checks the head out and runs a build
 * command from Studio's configuration. It is kept as a disabled alternative and not developed further.
 */
/** A preview waiting for its head to be built. */
export interface BuildRequest {
  readonly previewId: string;
  readonly identifier: string;
  /** The App previewed (null: the repository itself) and the preview's own App (where a runner's build uploads). */
  readonly targetAppId: string | null;
  readonly previewAppId: string;
  readonly repoUrl: string;
  readonly branch: string | null;
  readonly sha: string;
  /** For whom the build runs (the preview App's creator). */
  readonly by: string;
}

export interface BuildMethod {
  readonly id: 'ci' | 'runner';
  /** Asks for the build; CI builds on its own and answers nothing. */
  request(request: BuildRequest): Promise<void>;
}

/** CI builds on its own: Studio waits for its upload. */
export const ciBuildMethod: BuildMethod = {
  id: 'ci',
  request: () => Promise.resolve(),
};

/** `studio.builds` in the configuration. */
export interface StudioBuildsConfig {
  /** `ci` (the default) or `runner`. */
  readonly method?: 'ci' | 'runner';
  /** The runner method's build: the command, the archive it leaves, where it runs, how long it may take. */
  readonly runner?: {
    readonly command?: string;
    readonly artifact?: string;
    readonly workdir?: string;
    readonly timeoutSec?: number;
  };
}
