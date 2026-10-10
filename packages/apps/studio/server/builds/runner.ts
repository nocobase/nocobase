/**
 * The runner build method (`method.ts`), disabled unless `studio.builds.method: runner`: the build job of a preview
 * (`studio.preview-build`, the runner's `build` executor) checks the pull request's head out, runs the build command
 * from Studio's configuration (`studio.builds.runner`), and uploads the archive it leaves to release management as a
 * release of the preview App. The upload ticket is minted when a runner claims the job, inside the claim's
 * transaction, so a job waiting in the queue holds no credential and a ticket lives only as long as the build. Kept as
 * it was; previews are built by CI.
 */
import type { Releases } from '@nocobase/app-plugin-releases/server';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import type {
  Agents,
  BuildJobSpecInput,
  JobKindRegistration,
} from '@nocobase/app-plugin-agents/server/tokens';
import { z } from 'zod';

import { RELEASE_LABELS } from '../../shared/previews.js';
import type { BuildMethod, StudioBuildsConfig } from './method.js';

export const PREVIEW_BUILD_JOB = 'studio.preview-build';

/** The longest an upload ticket lives (release management's maximum). */
const MAX_TICKET_SECONDS = 3600;

/** What Studio stores for the job; the runner gets the build spec `prepare` makes of it. */
export interface PreviewBuildSpec {
  readonly previewId: string;
  readonly appId: string;
  /** Whom the upload ticket is issued for: the App's creator, whose upload it is. */
  readonly ticketUserId: string;
  readonly repo: {
    readonly url: string;
    readonly ref?: string;
    readonly sha?: string;
  };
  readonly workdir?: string;
  readonly command: string;
  readonly artifact: string;
  readonly timeoutSec: number;
  /** The release's labels: the issue, the branch and the commit. */
  readonly labels: Readonly<Record<string, string>>;
}

const SpecSchema = z.object({
  previewId: z.string().min(1).max(64),
  appId: z.string().min(1).max(128),
  ticketUserId: z.string().min(1).max(64),
  repo: z
    .object({
      url: z.string().min(1).max(2000),
      ref: z.string().min(1).max(255).optional(),
      sha: z
        .string()
        .regex(/^[0-9a-f]{7,64}$/u)
        .optional(),
    })
    .refine((repo) => repo.ref !== undefined || repo.sha !== undefined, {
      message: 'needs a ref or a sha',
    }),
  workdir: z.string().min(1).max(500).optional(),
  command: z.string().min(1).max(10_000),
  artifact: z.string().min(1).max(500),
  timeoutSec: z
    .number()
    .int()
    .positive()
    .max(6 * 60 * 60),
  labels: z.record(z.string(), z.string().max(255)),
});

/** The release management upload endpoint, relative to the server the runner talks to (the runner resolves it). */
export function uploadPath(appId: string): string {
  return `/api/releases/apps/${encodeURIComponent(appId)}/releases`;
}

export function previewBuildJob(deps: {
  readonly releases: () => Releases;
}): JobKindRegistration<PreviewBuildSpec> {
  return {
    executor: 'build',
    validate(spec) {
      const parsed = SpecSchema.safeParse(spec);
      if (!parsed.success)
        throw new Error(
          `Invalid preview build: ${parsed.error.issues[0]?.path.join('.') ?? ''} ${parsed.error.issues[0]?.message ?? ''}`.trim(),
        );
      return parsed.data;
    },
    async prepare({ conn, spec }): Promise<BuildJobSpecInput> {
      // Studio acts for the App's creator as a rule (the issue's permissions were checked when the build was asked
      // for); the ticket is theirs, and release management checks their upload right again when it is used.
      const ticket = await deps.releases().tickets.create(
        {
          userId: spec.ticketUserId,
          kind: 'rule',
          permissions: allPermissions(),
        },
        spec.appId,
        {
          ttlSeconds: Math.min(MAX_TICKET_SECONDS, spec.timeoutSec + 600),
        },
        conn,
      );
      return {
        repo: spec.repo,
        ...(spec.workdir ? { workdir: spec.workdir } : {}),
        command: { shell: spec.command },
        env: [],
        outputs: [
          {
            path: spec.artifact,
            upload: {
              url: uploadPath(spec.appId),
              method: 'POST',
              contentType: 'application/gzip',
              headers: {
                authorization: `Bearer ${ticket.token}`,
                'x-release-deploy': 'false',
                'x-release-labels': JSON.stringify(spec.labels),
              },
            },
          },
        ],
        timeoutSec: spec.timeoutSec,
      };
    },
  };
}

/** The release a finished build uploaded, from its result (`BuildJobResult`); null when there is none. */
export function uploadedRelease(
  result: unknown,
): { readonly releaseId: string; readonly sha: string | null } | null {
  if (!result || typeof result !== 'object') return null;
  const value = result as {
    sha?: unknown;
    outputs?: readonly {
      upload?: { status?: unknown; body?: unknown };
    }[];
  };
  const upload = value.outputs?.[0]?.upload;
  if (
    !upload ||
    typeof upload.status !== 'number' ||
    upload.status < 200 ||
    upload.status >= 300
  )
    return null;
  const body = upload.body as { data?: { id?: unknown } } | undefined;
  const releaseId = body?.data?.id;
  if (typeof releaseId !== 'string' || !releaseId) return null;
  return {
    releaseId,
    sha: typeof value.sha === 'string' ? value.sha : null,
  };
}

/** The runner method: a preview waiting for a head queues a build job of it, with the configured command. */
export function runnerBuildMethod(deps: {
  readonly runners: () => Pick<Agents, 'jobs'>;
  readonly config: NonNullable<StudioBuildsConfig['runner']>;
}): BuildMethod {
  return {
    id: 'runner',
    async request(request) {
      if (!deps.config.command) return;
      await deps.runners().jobs.enqueue({
        kind: PREVIEW_BUILD_JOB,
        spec: {
          previewId: request.previewId,
          appId: request.previewAppId,
          ticketUserId: request.by,
          repo: {
            url: request.repoUrl,
            sha: request.sha,
            ...(request.branch ? { ref: request.branch } : {}),
          },
          ...(deps.config.workdir ? { workdir: deps.config.workdir } : {}),
          command: deps.config.command,
          artifact: deps.config.artifact ?? 'dist.tar.gz',
          timeoutSec: deps.config.timeoutSec ?? 1800,
          labels: {
            [RELEASE_LABELS.sha]: request.sha,
            ...(request.targetAppId
              ? { [RELEASE_LABELS.app]: request.targetAppId }
              : {}),
          },
        } satisfies PreviewBuildSpec,
        actorUserId: request.by,
        via: 'rule',
        subject: { kind: 'preview', id: request.previewId },
        title: `Preview ${request.identifier}${request.targetAppId ? ` · ${request.targetAppId}` : ''}`,
      });
    },
  };
}
