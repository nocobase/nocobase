/**
 * Studio's pull requests joined to the projects plugin, the agents plugin and Studio's inbox; neither plugin knows about
 * branches, pull requests or code hosts. Binding:
 *
 * - registers the workflow event `studio.merged` and the entry condition `prMerged` (`workflow.ts`), before the
 *   "Software development" template that names the event is installed;
 * - creates the connections (`connections.ts`), the flow (`flow.ts`) and the service (`service.ts`);
 * - registers what a run's checkouts get when the agents plugin is there: the commit identity, co-author trailer and
 *   short-lived push credential (`run-git.ts`); the `pr` commands are routes (`routes.ts`);
 * - follows issues into and out of In review, to ask the owner to merge their ready pull requests and to withdraw that
 *   once the issue moves on otherwise (`cards.ts`);
 * - tells the followers of an issue that its pull request was merged (`notices.ts`).
 *
 * The poller (`poller.ts`) is started by the provider, and webhooks come in through `routes.ts`, not here.
 */
import type {
  NoticeRules,
  Projects,
  StatusRuleTypes,
  WorkflowEventTypes,
} from '@nocobase/app-plugin-projects/server/tokens';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';

import type { StudioInboxPort } from '../inbox/port.js';
import { IN_REVIEW } from './cards.js';
import {
  createPullRequestEvents,
  createRepoEvents,
  type PullRequestEvents,
  type RepoEvents,
} from './events.js';
import { createGitFlow } from './flow.js';
import { prMergedRule } from './notices.js';
import { createGitConnections, type GitConnections } from './connections.js';
import type { GitProviders } from './providers.js';
import { runGitProvider, type PreferenceOf } from './run-git.js';
import type { GitSecrets } from './sealing.js';
import { createStudioGit, type StudioGit } from './service.js';
import { registerGitWorkflow } from './workflow.js';

export interface StudioGitBindDeps {
  readonly projects: () => Projects;
  readonly events?: WorkflowEventTypes;
  readonly statusRules?: StatusRuleTypes;
  /** Where the merged pull request's notice goes (`notices.ts`); without it followers are not told. */
  readonly noticeRules?: NoticeRules;
  readonly agents?: Agents;
  readonly inbox: () => StudioInboxPort | undefined;
  /** The code hosts Studio knows (`providers.ts`). */
  readonly providers: GitProviders;
  readonly secrets: GitSecrets;
  readonly apiBaseUrls?: Readonly<Record<string, string>>;
  readonly webhookUrl?: (repoId: string) => string;
  /** Where a connection's app posts its events. */
  readonly connectionWebhookUrl?: (connectionId: string) => string;
  /** Where the host sends a person back after they authorize an app. */
  readonly callbackUrl?: () => string;
  /** A person's preferences (their commit attribution); none without the users plugin. */
  readonly preferenceOf?: PreferenceOf;
  readonly pollSeconds?: { readonly normal: number; readonly fallback: number };
  readonly now?: () => Date;
  readonly onError?: (message: string, error: unknown) => void;
  /** Something about a pull request was stored (`GitFlowDeps.onChanged`). */
  readonly onChanged?: () => void;
}

export function bindStudioGit(deps: StudioGitBindDeps): {
  readonly git: StudioGit;
  readonly connections: GitConnections;
  /** Pull requests stored and linked, for the rest of Studio (`events.ts`). */
  readonly events: PullRequestEvents;
  /** Pushes and workflow runs webhooks delivered (`events.ts`). */
  readonly repoEvents: RepoEvents;
  readonly release: () => void;
} {
  const onError =
    deps.onError ?? ((message, error) => console.error(message, error));
  const events = createPullRequestEvents(onError);
  const repoEvents = createRepoEvents(onError);
  const releases: (() => void)[] = [
    registerGitWorkflow({
      ...(deps.events ? { events: deps.events } : {}),
      ...(deps.statusRules ? { statusRules: deps.statusRules } : {}),
    }),
  ];
  const flow = createGitFlow({
    projects: deps.projects,
    agents: () => deps.agents,
    inbox: deps.inbox,
    onError,
    ...(deps.onChanged ? { onChanged: deps.onChanged } : {}),
    onStored: (pr) => events.emit({ type: 'stored', pullRequestId: pr.id }),
  });
  const connections = createGitConnections({
    conn: () => deps.projects().tx.read(),
    providers: deps.providers,
    secrets: deps.secrets,
    ...(deps.apiBaseUrls ? { apiBaseUrls: deps.apiBaseUrls } : {}),
    ...(deps.connectionWebhookUrl
      ? { webhookUrl: deps.connectionWebhookUrl }
      : {}),
    ...(deps.callbackUrl ? { callbackUrl: deps.callbackUrl } : {}),
    ...(deps.now ? { now: deps.now } : {}),
  });
  const git = createStudioGit({
    projects: deps.projects,
    providers: deps.providers,
    connections,
    secrets: deps.secrets,
    flow,
    events,
    repoEvents,
    ...(deps.apiBaseUrls ? { apiBaseUrls: deps.apiBaseUrls } : {}),
    ...(deps.webhookUrl ? { webhookUrl: deps.webhookUrl } : {}),
    ...(deps.pollSeconds ? { pollSeconds: deps.pollSeconds } : {}),
    ...(deps.now ? { now: deps.now } : {}),
  });
  if (deps.noticeRules)
    releases.push(deps.noticeRules.add(prMergedRule(deps.projects)));
  if (deps.agents) {
    releases.push(
      deps.agents.repoAccess.register(
        runGitProvider({
          projects: deps.projects,
          git: () => git,
          connections,
          ...(deps.preferenceOf ? { preferenceOf: deps.preferenceOf } : {}),
          onError,
        }),
      ),
    );
  }
  releases.push(
    deps.projects().events.on('issue.updated', (event) => {
      const status = event.changes.status;
      if (!status) return;
      const work =
        status.to === IN_REVIEW
          ? flow.requestMerges(event.issueId)
          : status.from === IN_REVIEW
            ? flow.withdrawMerges(event.issueId)
            : null;
      work?.catch((error: unknown) =>
        onError(
          'Studio could not update the merge requests of an issue.',
          error,
        ),
      );
    }),
  );
  return {
    git,
    connections,
    events,
    repoEvents,
    release: () => {
      for (const release of releases.splice(0).reverse()) release();
    },
  };
}
