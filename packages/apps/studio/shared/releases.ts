/**
 * The Apps a project's repository builds, as the server and the browser exchange them: release management knows
 * environments and Apps, the projects plugin knows repositories, and Studio joins them. CI is the source of truth: the
 * repository's CI makes sure of the App it deploys (`nb-studio app ensure <app> --environment <env>`, created when missing
 * and the credential may create Apps) and deploys a verified commit to it (`shared/builds.ts`); the App is then
 * recorded as the repository's, in the role its environment gives it (`roleOfEnvironment`), which deployment marks
 * follow. An App made by `app ensure` whose first deployment is an open pull request's head is that pull request's
 * preview instead (`shared/previews.ts`); nothing in the repository's settings turns previews on.
 *
 * `GET /api/repositoryDeployments/:resourceId` answers `RepositoryDeployment`; `PUT` takes
 * `SaveRepositoryDeploymentRequest` (the complete set: an App left out is unlinked), with the "Deploy & previews" choices
 * (`DeploySettings`) that create the Apps they need. `GET …/ciWorkflow` answers `CiWorkflow`, the GitHub Actions
 * workflows that deploy its pull requests' previews, one per application. `GET /api/repositoryDeployments?appId=` names
 * the repositories that build an App. A preview's variables are its environment's and its own App's, as any App's.
 *
 * **Deploy & previews.** A repository's simple choices, offered where it is added (New project, a project's settings)
 * and edited with its other settings: optionally a staging environment and a production one; Studio creates the Apps
 * they need, named after the repository (`appIdsFor`): `<repo>` in production, `<repo>-staging` in staging. The preview
 * choice is kept for the forms that still send it and changes nothing. Apps are created by Studio on the person's behalf
 * (`createdBy` is them), for someone who may create Apps or deploy to every App (`maySetUpApps`); anyone else links Apps
 * that exist instead. `configureCi` has Studio set the repository's CI up by itself (`shared/builds.ts`, `CiSetupView`);
 * without it, or when that fails, the workflow is copied by hand.
 */

/** The long-lived roles a linked App plays: built from the default branch, or from tags. */
export const APP_ROLES = ['staging', 'production'] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface RepositoryAppLink {
  readonly appId: string;
  /** Staging (the default branch) or production (tags); null for an App only previewed. */
  readonly role: AppRole | null;
  /** Where its pull requests are previewed; null for none. */
  readonly previewEnvironmentId: string | null;
}

/** A linked App as the settings read it, with what release management says of it. */
export interface RepositoryLinkedApp extends RepositoryAppLink {
  readonly name: string;
  readonly environmentId: string;
}

/** The "Deploy & previews" choices of a repository (see above); every environment id null leaves it out. */
export interface DeploySettings {
  /** Where its pull requests are previewed: an environment that runs archives and is not protected. */
  readonly previewEnvironmentId: string | null;
  readonly stagingEnvironmentId: string | null;
  readonly productionEnvironmentId: string | null;
  /** Whether Studio sets the repository's CI up by itself. */
  readonly configureCi: boolean;
}

/**
 * Where the repository's CI setup stands: `manual` while the workflow and its API key are set up by hand (also what
 * an automatic setup falls back to), `pending` while a repository Studio created waits for its initialization before
 * the workflow is committed, `configured` once Studio committed the workflow and wrote its secret, `pr-open` while the
 * pull request adding or updating it waits, `disabled` when nobody asked Studio to.
 */
export const CI_STATES = [
  'manual',
  'pending',
  'configured',
  'pr-open',
  'disabled',
] as const;
export type CiState = (typeof CI_STATES)[number];

export interface RepositoryCi {
  /** Whether Studio was asked to set the CI up by itself. */
  readonly auto: boolean;
  readonly state: CiState;
}

export interface RepositoryDeployment {
  readonly resourceId: string;
  readonly projectId: string;
  readonly apps: readonly RepositoryLinkedApp[];
  /** The CI choice, once one was made; null before. */
  readonly ci: RepositoryCi | null;
  /** `owner/name` on its host, when the working directory is linked to one: its CI can build. */
  readonly repo: string | null;
  /** The branch staging builds come from. */
  readonly defaultBranch: string;
  /** Whether the viewer may change the links (they may manage the project). */
  readonly canEdit: boolean;
}

/** A repository that builds an App, as the Delete App confirmation names it (`AppUsage`). */
export interface AppUsageRepository {
  readonly resourceId: string;
  readonly projectId: string;
  readonly projectName: string;
  /** `owner/name` on its host, else from its clone URL (`repositoryFullName`). */
  readonly repo: string | null;
  readonly role: AppRole | null;
  /** Whether pull request previews of this App live in this repository. */
  readonly previews: boolean;
}

/**
 * `GET /api/repositoryDeployments/apps/:appId/usage`: what deleting the App stops, for the Delete App confirmation:
 * the repositories it is recorded for that the caller can see, and how many pull request previews of it run, which go
 * with it. Nothing offers to recreate it: CI's next deploy naming it does.
 */
export interface AppUsage {
  readonly appId: string;
  readonly repositories: readonly AppUsageRepository[];
  readonly runningPreviews: number;
}

export interface SaveRepositoryDeploymentRequest {
  readonly apps: readonly RepositoryAppLink[];
  /** The simple choices: Apps they need are created and linked, and the roles they leave out are unlinked. */
  readonly plan?: DeploySettings;
}

/** `GET /api/repositoryDeployments?appId=`: a repository that builds the App, in a project the viewer may see. */
export interface AppRepository {
  readonly resourceId: string;
  readonly projectId: string;
  readonly projectName: string;
  /** `owner/name` on its host, when linked to one. */
  readonly repo: string | null;
  readonly url: string;
  /** For a preview App: the number of the pull request it previews; null otherwise. */
  readonly pullRequest: number | null;
}

/**
 * How a repository is named wherever Studio shows it: `owner/name` on its host, else the clone URL's last two segments
 * (`https://host/acme/crm.git`, `git@host:acme/crm.git`), else the URL as given.
 */
export function repositoryFullName(repository: {
  readonly repo?: string | null;
  readonly url?: string | null;
}): string {
  if (repository.repo) return repository.repo;
  const url = repository.url?.trim() ?? '';
  const segments = url
    .replace(/\.git$/u, '')
    .replace(/\/+$/u, '')
    .split(/[/:]/u)
    .filter(Boolean);
  return segments.length >= 2 ? segments.slice(-2).join('/') : url;
}

/** The App ids a repository's Apps start from: `<repo>`, `<repo>-staging`. */
export function appIdsFor(repoName: string): {
  readonly production: string;
  readonly staging: string;
} {
  const base =
    repoName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/gu, '-')
      .replace(/^[-_]+|[-_]+$/gu, '')
      .slice(0, 100) || 'app';
  return { production: base, staging: `${base}-staging` };
}

/** The scopes Apps are set up with: who may create Apps, or deploy to every App, has Studio create them for a repository. */
export function maySetUpApps(scopes: {
  readonly 'rel.apps/create': unknown;
  readonly 'rel.apps/deploy': unknown;
}): boolean {
  return (
    scopes['rel.apps/create'] === 'all' || scopes['rel.apps/deploy'] === 'all'
  );
}

/**
 * The role an App of a repository plays in the environment it runs in, which deployment marks and the "done, not
 * released" reminder follow: `production` for a release target (a protected environment, or one named `production`),
 * `staging` for any other. A later setting of the environment may say it outright.
 */
export function roleOfEnvironment(environment: {
  readonly id: string;
  readonly name: string;
  readonly protected: boolean;
}): AppRole {
  return environment.protected ||
    environment.id.toLowerCase() === 'production' ||
    environment.name.trim().toLowerCase() === 'production'
    ? 'production'
    : 'staging';
}

/** A workflow file Studio writes: where it goes in the repository and what it says. */
export interface CiWorkflowFile {
  readonly path: string;
  readonly content: string;
}

/** The workflows Studio writes for a repository's previews: one file per application. */
export interface CiWorkflow {
  readonly files: readonly CiWorkflowFile[];
  /** The repository secret they read the upload key from. */
  readonly secret: string;
}

/**
 * How an environment names who decides its deployment requests (`approvers`, release management's opaque references):
 * `lead` is the lead of each project whose repository deploys to the App, `admins` every owner and administrator, and
 * anything else one person by user ID, username or email.
 */
export const APPROVER_LEAD = 'lead';
export const APPROVER_ADMINS = 'admins';
