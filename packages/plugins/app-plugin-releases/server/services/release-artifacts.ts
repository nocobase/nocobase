/**
 * An image release's images (`relReleaseArtifacts`): one per platform, recorded by repository and digest, which CI
 * built and pushed and registers through the API (`acme release image`). A promoted release carries its source's, so
 * staging and production deploy the same digest.
 */
import { randomUUID } from 'node:crypto';

import type { DatabaseConnection, DatabaseManager, Row } from '@nocobase/db';

import type {
  ActorKind,
  RegisterImageReleaseInput,
  ReleaseArtifactView,
} from '../../shared/releases.js';
import { ReleasesError } from '../errors.js';
import { decodeDate, nullableString } from './codec.js';

/** An image repository without tag or digest: an optional registry host, then lowercase path components. */
const REPOSITORY_PATTERN =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?(?::[0-9]+)?\/)?[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*(?:\/[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*)*$/u;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;
const PLATFORM_PATTERN = /^[a-z0-9]+\/[a-z0-9_]+(?:\/[a-z0-9]+)?$/u;
const COMMIT_PATTERN = /^[0-9a-f]{7,64}$/u;

export type ImageArtifactView = Extract<
  ReleaseArtifactView,
  { kind: 'oci-image' }
>;

/** `ghcr.io/acme/app:1.2@sha256:…` → `ghcr.io/acme/app`: the repository a reference names. */
export function imageRepository(reference: string): string {
  let ref = reference.trim();
  const at = ref.indexOf('@');
  if (at !== -1) ref = ref.slice(0, at);
  const slash = ref.lastIndexOf('/');
  const colon = ref.lastIndexOf(':');
  if (colon > slash) ref = ref.slice(0, colon);
  return ref;
}

export interface ImageRegistration {
  readonly ref: string;
  readonly digest: string;
  readonly platform: string;
  readonly sourceCommit: string | null;
}

/** Checks the image CI registers; throws `INVALID_IMAGE`. */
export function normalizeImage(
  input: Pick<
    RegisterImageReleaseInput,
    'ref' | 'digest' | 'platform' | 'sourceCommit'
  >,
): ImageRegistration {
  const invalid = (message: string) =>
    new ReleasesError(message, 'INVALID_IMAGE', 'INVALID_ARGUMENT');
  if (!input || typeof input !== 'object')
    throw invalid('Give the image as { ref, digest, platform }.');
  if (typeof input.ref !== 'string' || input.ref.length > 500)
    throw invalid('ref is the image repository, such as ghcr.io/acme/app.');
  const ref = imageRepository(input.ref);
  if (!REPOSITORY_PATTERN.test(ref))
    throw invalid(`${input.ref} is not an image repository.`);
  if (typeof input.digest !== 'string' || !DIGEST_PATTERN.test(input.digest))
    throw invalid('digest is sha256: and 64 hex digits.');
  const platform = input.platform ?? 'linux/amd64';
  if (typeof platform !== 'string' || !PLATFORM_PATTERN.test(platform))
    throw invalid('platform is like linux/amd64.');
  const commit = input.sourceCommit;
  if (
    commit !== undefined &&
    (typeof commit !== 'string' || !COMMIT_PATTERN.test(commit))
  )
    throw invalid('sourceCommit is a commit hash.');
  return {
    ref,
    digest: input.digest,
    platform,
    sourceCommit: commit ?? null,
  };
}

export function decodeImageArtifact(row: Row): ImageArtifactView {
  return {
    kind: 'oci-image',
    id: String(row.id),
    ref: String(row.ref),
    digest: String(row.digest),
    platform: String(row.platform),
    sourceCommit: nullableString(row.sourceCommit),
    createdBy: nullableString(row.createdBy),
    createdVia: (nullableString(row.createdVia) ?? 'human') as ActorKind,
    createdAt: decodeDate(row.createdAt).toISOString(),
  };
}

export class ReleaseArtifactStore {
  public constructor(private readonly database: DatabaseManager) {}

  /** The images of each release, newest first. */
  public async imagesOf(
    releaseIds: readonly string[],
    conn?: DatabaseConnection,
  ): Promise<Map<string, ImageArtifactView[]>> {
    const images = new Map<string, ImageArtifactView[]>();
    if (releaseIds.length === 0) return images;
    const rows = await (conn ?? this.database.connection()).query
      .selectFrom('relReleaseArtifacts')
      .selectAll()
      .where('releaseId', 'in', [...releaseIds])
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'asc')
      .execute<Row>();
    for (const row of rows) {
      const key = String(row.releaseId);
      images.set(key, [...(images.get(key) ?? []), decodeImageArtifact(row)]);
    }
    return images;
  }

  /**
   * Records an image of a release and of every release promoted from it. The same digest again is a no-op; another
   * digest for a platform that already has one is refused (`IMAGE_CONFLICT`): a release's image never changes.
   */
  public async register(
    conn: DatabaseConnection,
    release: { readonly id: string; readonly appId: string },
    image: ImageRegistration,
    actor: { readonly userId: string | null; readonly kind: ActorKind },
  ): Promise<{ view: ImageArtifactView; created: boolean }> {
    const targets: { id: string; appId: string }[] = [release];
    for (let index = 0; index < targets.length; index += 1) {
      const promoted = await conn.query
        .selectFrom('relReleases')
        .select(['id', 'appId'])
        .where('sourceReleaseId', '=', targets[index].id)
        .execute<Row>();
      for (const row of promoted)
        if (!targets.some((target) => target.id === String(row.id)))
          targets.push({ id: String(row.id), appId: String(row.appId) });
    }
    let first: { view: ImageArtifactView; created: boolean } | undefined;
    for (const target of targets) {
      const existing = await conn.query
        .selectFrom('relReleaseArtifacts')
        .selectAll()
        .where('releaseId', '=', target.id)
        .where('kind', '=', 'oci-image')
        .where('platform', '=', image.platform)
        .executeTakeFirst<Row>();
      if (existing) {
        if (
          String(existing.digest) !== image.digest ||
          String(existing.ref) !== image.ref
        ) {
          if (target.id === release.id)
            throw new ReleasesError(
              `The release already has the image ${String(existing.ref)}@${String(existing.digest)} for ${image.platform}; a release's image never changes.`,
              'IMAGE_CONFLICT',
              'FAILED_PRECONDITION',
            );
          continue;
        }
        first ??= { view: decodeImageArtifact(existing), created: false };
        continue;
      }
      const row = {
        id: randomUUID(),
        releaseId: target.id,
        appId: target.appId,
        kind: 'oci-image',
        ref: image.ref,
        digest: image.digest,
        platform: image.platform,
        sourceCommit: image.sourceCommit,
        createdBy: actor.userId,
        createdVia: actor.kind,
        createdAt: new Date(),
      };
      await conn.query.insertInto('relReleaseArtifacts').values(row).execute();
      first ??= { view: decodeImageArtifact(row), created: true };
    }
    return first!;
  }

  /** Copies a release's images to its promoted copy. */
  public async copy(
    conn: DatabaseConnection,
    fromReleaseId: string,
    to: { readonly id: string; readonly appId: string },
  ): Promise<void> {
    const rows = await conn.query
      .selectFrom('relReleaseArtifacts')
      .selectAll()
      .where('releaseId', '=', fromReleaseId)
      .execute<Row>();
    for (const row of rows) {
      const present = await conn.query
        .selectFrom('relReleaseArtifacts')
        .select('id')
        .where('releaseId', '=', to.id)
        .where('kind', '=', String(row.kind))
        .where('platform', '=', String(row.platform))
        .executeTakeFirst<Row>();
      if (present) continue;
      await conn.query
        .insertInto('relReleaseArtifacts')
        .values({ ...row, id: randomUUID(), releaseId: to.id, appId: to.appId })
        .execute();
    }
  }
}
