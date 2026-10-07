/**
 * The skill library: skills in the open Agent Skills format, every save a new version, the latest one always the one
 * runs get. An older version can be compared and restored (as a new version). Skills are attached to agents, and as
 * defaults to a working directory or a scope the application registers. Who may change skills is the route's concern;
 * the service checks only the values.
 *
 * A skill is named and described by its `SKILL.md` front matter alone, checked against the Agent Skills specification
 * on every create, save, restore and import (`parseSkillMarkdown`), with each problem's field and reason in the error.
 * Its `name` is the skill's slug: a save that changes it renames the skill, refused when another skill has that name.
 * Runs claimed afterwards get it under the new name; a run already given the skill reads its version by hash.
 *
 * A version keeps its `SKILL.md` body in its row and lists its files in a manifest (`ManifestEntry`): each file's bytes
 * are a blob stored once per content (`blobs.ts`). A save resolves its files to blobs before its transaction; a runner's
 * bundle and an online run's snapshot are assembled from blobs and kept in memory by the version's hash. A skill moves
 * as a zip in the Agent Skills layout (`importArchive`, `exportArchive`).
 */
import {
  RUNNER_ROUTES,
  routePath,
  type RunSkill,
  type SkillBundle,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';

import {
  SKILL_CONTENT_MAX_BYTES,
  SKILL_FILE_MAX_BYTES,
  SKILL_MAX_BYTES,
  SKILL_MAX_FILES,
  SKILL_UPLOAD_MAX_BYTES,
  formatBytes,
  isSkillScript,
  parseSkillMarkdown,
  skillFilePathProblem,
  type Skill,
  type SkillAttachment,
  type SkillDetail,
  type SkillFileEntry,
  type SkillFileInput,
  type SkillFrontMatterProblem,
  type SkillImport,
  type SkillInput,
  type SkillSave,
  type SkillScope,
  type SkillUpload,
  type SkillVersion,
  type SkillVersionDetail,
} from '../../../shared/skills.js';
import type { Clock } from '../../kernel/clock.js';
import {
  invalid,
  notFound,
  precondition,
  ProtocolError,
} from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { People } from '../../kernel/people.js';
import type { TxRunner } from '../../kernel/tx.js';
import { findAgent } from '../agents/agent.store.js';
import { SizedCache, type SkillBlobs } from './blobs.js';
import {
  bundleFiles,
  deliveredMarkdown,
  toBundle,
  versionHash,
  type ManifestEntry,
} from './bundle.js';
import {
  attachedSkillIds,
  attachmentsRepo,
  replaceAttachments,
  skillsRepo,
  versionsRepo,
  type SkillRecord,
  type SkillVersionRecord,
} from './skill.store.js';
import { readZip, writeZip, ZipError, type ZipEntry } from './zip.js';

const HASH = /^[0-9a-f]{64}$/u;

const FileSchema = z
  .strictObject({
    path: z.string().max(255),
    content: z.string().optional(),
    hash: z.string().regex(HASH).optional(),
    executable: z.boolean().optional(),
  })
  .refine(
    (file) => (file.content === undefined) !== (file.hash === undefined),
    'Give a file its content or the hash of stored content, not both.',
  );

const contentField = z.string().meta({
  description:
    "SKILL.md: YAML front matter with `name` (the skill's directory: 1–64 lower-case letters, digits and single hyphens) and `description` (1–1024 characters), optionally `license`, `compatibility`, `metadata` and `allowed-tools`, then the Markdown body.",
});

export const SkillInputSchema: z.ZodType<SkillInput> = z.strictObject({
  content: contentField,
  files: z.array(FileSchema).optional(),
});

function revisionConflict(current: number): Error {
  return new ProtocolError(
    'REVISION_CONFLICT',
    'The skill was changed by someone else since you opened it. Reload it to see what changed, then make your change again.',
    { revision: current },
  );
}

export const SkillSaveSchema: z.ZodType<SkillSave> = z.strictObject({
  content: contentField,
  files: z.array(FileSchema),
  note: z.string().trim().max(500).nullable().optional(),
  expectedRevision: z.number().int().min(1),
});

export const SkillImportSchema: z.ZodType<SkillImport> = z.strictObject({
  archive: z.string().regex(HASH),
  skillId: z.string().min(1).max(64).optional(),
  expectedRevision: z.number().int().min(1).optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

export const SkillIdsSchema: z.ZodType<{ readonly skillIds: string[] }> =
  z.strictObject({ skillIds: z.array(z.string().min(1).max(64)).max(100) });

/** A scope and its id: where skills are attached. */
export interface SkillTarget {
  readonly scope: SkillScope;
  readonly scopeId: string;
}

export interface SkillService {
  list(): Promise<Skill[]>;
  get(id: string): Promise<SkillDetail>;
  create(userId: string | null, input: SkillInput): Promise<SkillDetail>;
  /**
   * A new version with everything given, when the skill is still at `save.expectedRevision` (its revision is its
   * current version): 409 `REVISION_CONFLICT` with the current `metadata.revision` otherwise.
   */
  save(
    id: string,
    userId: string | null,
    save: SkillSave,
  ): Promise<SkillDetail>;
  remove(id: string): Promise<void>;
  versions(id: string): Promise<SkillVersion[]>;
  version(id: string, version: number): Promise<SkillVersionDetail>;
  /** `version` becomes current again, as a new version, when the skill is still at `expectedRevision`. */
  restore(
    id: string,
    version: number,
    userId: string | null,
    expectedRevision: number,
  ): Promise<SkillDetail>;
  attached(target: SkillTarget): Promise<string[]>;
  /** Makes `skillIds` the skills attached to the target; unknown ids are refused. */
  attach(
    target: SkillTarget,
    skillIds: readonly string[],
    conn?: DatabaseConnection,
  ): Promise<string[]>;
  /**
   * For a claim: the latest version of every skill attached to `targets`, each once. Where two skills share a slug,
   * the earlier target's wins (the claim lists the agent first).
   */
  forRun(
    conn: DatabaseConnection,
    targets: readonly SkillTarget[],
    runId: string,
  ): Promise<RunSkill[]>;
  /** One of a run's skills, as the runner fetches it: assembled from its blobs, cached by its version's hash. */
  bundle(conn: DatabaseConnection, slug: string): Promise<SkillBundle>;
  /** Stores a file or a zip to import, before the save or import that names it (`SkillUpload.id`). */
  upload(bytes: Uint8Array): Promise<SkillUpload>;
  /** A file of a version, as it is stored. */
  file(
    id: string,
    version: number,
    path: string,
  ): Promise<{ readonly path: string; readonly bytes: Uint8Array }>;
  /** A version (the current one by default) as a zip in the Agent Skills layout: `<slug>/SKILL.md` and its files. */
  exportArchive(
    id: string,
    version?: number,
  ): Promise<{ readonly filename: string; readonly bytes: Uint8Array }>;
  /** A zip in the Agent Skills layout as a new skill, or as a new version of `input.skillId`. */
  importArchive(
    userId: string | null,
    input: SkillImport,
  ): Promise<SkillDetail>;
  /**
   * A version of one of a run's skills, as an online run reads it: `SKILL.md` and its files, text read, by the
   * version's hash (`RunSkill.hash`); kept in memory, least recently used out first.
   */
  snapshot(slug: string, hash: string): Promise<SkillSnapshot>;
  /** Deletes stored contents no version names, last used more than `graceMs` ago; the number deleted. */
  collectGarbage(graceMs: number): Promise<number>;
}

/** A skill version as an online run's sandbox mounts it. */
export interface SkillSnapshot {
  readonly slug: string;
  readonly hash: string;
  /** `SKILL.md` as delivered, with its front matter. */
  readonly markdown: string;
  readonly files: readonly {
    readonly path: string;
    readonly size: number;
    readonly executable: boolean;
    /** The text; null for a binary file. */
    readonly text: string | null;
  }[];
}

export interface SkillServiceDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  readonly people: People;
  readonly blobs: SkillBlobs;
}

const ManifestSchema = z.array(
  z.object({
    path: z.string(),
    blobHash: z.string(),
    size: z.number(),
    executable: z.boolean(),
    text: z.boolean(),
  }),
);

function manifestOf(value: unknown): ManifestEntry[] {
  const parsed = ManifestSchema.safeParse(
    typeof value === 'string' ? (JSON.parse(value) as unknown) : value,
  );
  return parsed.success ? parsed.data : [];
}

/** A `SKILL.md` refused: the first problem in the message, each with its field and reason in `problems`. */
function frontMatterInvalid(
  problems: readonly SkillFrontMatterProblem[],
): ProtocolError {
  const [first] = problems;
  return invalid(`SKILL.md: ${first?.message ?? 'invalid front matter.'}`, {
    field: first?.field,
    reason: first?.reason,
    problems: problems.map((item) => ({ ...item })),
  });
}

/** A `SKILL.md` that may be saved, with what its front matter says. */
interface CheckedSkill {
  readonly content: string;
  readonly name: string;
  readonly description: string;
}

function checkedSkill(content: string): CheckedSkill {
  if (Buffer.byteLength(content, 'utf8') > SKILL_CONTENT_MAX_BYTES)
    throw invalid(
      `SKILL.md is larger than ${formatBytes(SKILL_CONTENT_MAX_BYTES)}.`,
      { field: 'content', reason: 'tooLarge' },
    );
  const parsed = parseSkillMarkdown(content);
  const { name, description } = parsed.frontMatter;
  if (parsed.problems.length > 0 || !name || !description)
    throw frontMatterInvalid(parsed.problems);
  return { content, name, description };
}

const tooLarge = (path: string): ProtocolError =>
  invalid(`${path} is larger than ${formatBytes(SKILL_FILE_MAX_BYTES)}.`, {
    path,
    reason: 'tooLarge',
  });

/** The zip's skill: its `SKILL.md` and files, from its root or its single top folder. */
function skillOfArchive(entries: readonly ZipEntry[]): {
  readonly folder: string | null;
  readonly markdown: string;
  readonly files: readonly ZipEntry[];
} {
  const kept = entries.filter(
    (entry) =>
      !entry.name.startsWith('__MACOSX/') &&
      !entry.name.split('/').some((part) => part === '.DS_Store'),
  );
  const root = kept.find((entry) => entry.name === 'SKILL.md');
  let folder: string | null = null;
  let prefix = '';
  if (!root) {
    const tops = new Set(kept.map((entry) => entry.name.split('/')[0]));
    const [top] = [...tops];
    if (
      tops.size !== 1 ||
      !top ||
      !kept.some((entry) => entry.name === `${top}/SKILL.md`)
    )
      throw invalid(
        'The archive has no SKILL.md at its root or in its single top folder.',
      );
    folder = top;
    prefix = `${top}/`;
  }
  const markdown = kept.find((entry) => entry.name === `${prefix}SKILL.md`)!;
  return {
    folder,
    markdown: Buffer.from(markdown.bytes).toString('utf8'),
    files: kept
      .filter((entry) => entry !== markdown)
      .map((entry) => ({ ...entry, name: entry.name.slice(prefix.length) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export function createSkillService(deps: SkillServiceDeps): SkillService {
  const { tx, ids, clock, people, blobs } = deps;
  // Bundles and snapshots of versions, by version hash.
  const bundles = new SizedCache<SkillBundle>(64 * 1024 * 1024);
  const snapshots = new SizedCache<SkillSnapshot>(32 * 1024 * 1024);

  /**
   * The manifest of `inputs`: text stored as blobs, hashes checked against what is stored, within the limits. Blobs
   * are stored outside the save's transaction (`blobs.store`); a save that fails leaves them to the collector.
   */
  const manifestFor = async (
    inputs: readonly SkillFileInput[],
    content: string,
  ): Promise<ManifestEntry[]> => {
    if (inputs.length > SKILL_MAX_FILES)
      throw invalid(`A skill holds at most ${SKILL_MAX_FILES} files.`);
    const seen: string[] = [];
    const stored = await blobs.info(
      tx.read(),
      inputs.flatMap((file) => (file.hash ? [file.hash] : [])),
    );
    let total = Buffer.byteLength(content, 'utf8');
    const planned = inputs.map((file) => {
      const path = file.path.trim();
      const problem = skillFilePathProblem(path, seen);
      if (problem)
        throw invalid(`The file path ${path || '(empty)'} is ${problem}.`, {
          path,
          reason: problem,
        });
      seen.push(path);
      const executable = file.executable ?? false;
      if (file.hash !== undefined) {
        const blob = stored.get(file.hash);
        if (!blob)
          throw invalid(
            `The content of ${path} is not stored; upload it first.`,
            { path, reason: 'unknownContent' },
          );
        if (blob.size > SKILL_FILE_MAX_BYTES) throw tooLarge(path);
        total += blob.size;
        return { path, executable, blob, bytes: null };
      }
      const bytes = Buffer.from(file.content ?? '', 'utf8');
      if (bytes.length > SKILL_FILE_MAX_BYTES) throw tooLarge(path);
      total += bytes.length;
      return { path, executable, blob: null, bytes };
    });
    if (total > SKILL_MAX_BYTES)
      throw invalid(
        `A skill holds at most ${formatBytes(SKILL_MAX_BYTES)} in all.`,
      );
    const manifest: ManifestEntry[] = [];
    for (const file of planned) {
      const blob = file.blob ?? (await blobs.store(file.bytes));
      manifest.push({
        path: file.path,
        blobHash: blob.hash,
        size: blob.size,
        executable: file.executable,
        text: blob.text,
      });
    }
    return manifest;
  };

  /** The files of a manifest as people read them: text files with their text. */
  const entriesOf = async (
    manifest: readonly ManifestEntry[],
  ): Promise<SkillFileEntry[]> => {
    const entries: SkillFileEntry[] = [];
    for (const entry of manifest)
      entries.push({
        path: entry.path,
        hash: entry.blobHash,
        size: entry.size,
        executable: entry.executable,
        content: entry.text
          ? Buffer.from(await blobs.read(entry.blobHash)).toString('utf8')
          : null,
      });
    return entries;
  };

  const sizeOf = (content: string, manifest: readonly ManifestEntry[]) =>
    manifest.reduce(
      (sum, entry) => sum + entry.size,
      Buffer.byteLength(content, 'utf8'),
    );

  const requireSkill = async (
    conn: DatabaseConnection,
    id: string,
  ): Promise<SkillRecord> => {
    const skill = await skillsRepo(conn).findOne({ filter: { id } });
    if (!skill) throw notFound('Skill');
    return skill;
  };

  const versionOf = async (
    conn: DatabaseConnection,
    skillId: string,
    version: number,
  ): Promise<SkillVersionRecord> => {
    const record = await versionsRepo(conn).findOne({
      filter: { skillId, version },
    });
    if (!record) throw notFound('Skill version');
    return record;
  };

  const agentCounts = async (
    conn: DatabaseConnection,
  ): Promise<Map<string, number>> => {
    const rows = await attachmentsRepo(conn).findMany({
      filter: { scope: 'agent' },
    });
    const counts = new Map<string, number>();
    for (const row of rows)
      counts.set(row.skillId, (counts.get(row.skillId) ?? 0) + 1);
    return counts;
  };

  const summary = (
    skill: SkillRecord,
    current: SkillVersionRecord | undefined,
    agents: number,
  ): Skill => {
    const manifest = manifestOf(current?.manifest);
    const scripts = manifest
      .filter((entry) => isSkillScript(entry))
      .map((entry) => entry.path)
      .sort((a, b) => a.localeCompare(b));
    return {
      id: skill.id,
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      compatibility: current
        ? (parseSkillMarkdown(current.content).frontMatter.compatibility ??
          null)
        : null,
      version: Number(skill.currentVersion),
      fileCount: manifest.length,
      size: current ? sizeOf(current.content, manifest) : 0,
      scriptCount: scripts.length,
      scripts,
      agentCount: agents,
      createdById: skill.createdById,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };
  };

  const detail = async (
    conn: DatabaseConnection,
    id: string,
  ): Promise<SkillDetail> => {
    const skill = await requireSkill(conn, id);
    const current = await versionOf(conn, id, Number(skill.currentVersion));
    const rows = await attachmentsRepo(conn).findMany({
      filter: { skillId: id },
      sort: (sort) => [
        sort.field('scope').asc(),
        sort.field('createdAt').asc(),
      ],
    });
    const attachments: SkillAttachment[] = [];
    for (const row of rows) {
      const agent =
        row.scope === 'agent' ? await findAgent(conn, row.scopeId) : null;
      if (row.scope === 'agent' && !agent) continue;
      attachments.push({
        scope: row.scope,
        scopeId: row.scopeId,
        name: agent?.name ?? null,
      });
    }
    return {
      ...summary(
        skill,
        current,
        attachments.filter((item) => item.scope === 'agent').length,
      ),
      content: deliveredMarkdown(
        skill.slug,
        current.description,
        current.content,
      ),
      files: await entriesOf(manifestOf(current.manifest)),
      attachments,
    };
  };

  /**
   * Writes version `version` of the skill and makes it current, under its front matter's name (the slug, which a save
   * may change); refused as a revision conflict when another save made a version since the skill was read
   * (`version - 1` is no longer current), and when another skill has the name.
   */
  const writeVersion = async (
    conn: DatabaseConnection,
    skillId: string,
    version: number,
    values: CheckedSkill & {
      readonly manifest: readonly ManifestEntry[];
      readonly note: string | null;
    },
    userId: string | null,
    now: string,
  ): Promise<void> => {
    await requireFreeName(conn, values.name, skillId);
    await versionsRepo(conn).createOne({
      values: {
        id: ids.next(),
        skillId,
        version,
        name: values.name,
        description: values.description,
        content: values.content,
        manifest: values.manifest.map((entry) => ({ ...entry })),
        note: values.note,
        contentHash: versionHash(
          deliveredMarkdown(values.name, values.description, values.content),
          values.manifest,
        ),
        createdById: userId,
        createdAt: now,
      },
    });
    await blobs.touch(
      conn,
      values.manifest.map((entry) => entry.blobHash),
    );
    const { updatedCount } = await skillsRepo(conn).updateMany({
      filter: { id: skillId, currentVersion: version - 1 },
      values: {
        slug: values.name,
        name: values.name,
        description: values.description,
        currentVersion: version,
        updatedAt: now,
      },
    });
    if (updatedCount === 0 && version > 1)
      throw revisionConflict(
        Number((await requireSkill(conn, skillId)).currentVersion),
      );
  };

  /** Refuses a change made against a revision the skill has left. */
  const requireRevision = (skill: SkillRecord, expected: number): void => {
    const current = Number(skill.currentVersion);
    if (expected !== current) throw revisionConflict(current);
  };

  /** Refuses a name another skill has (`taken`, on the field `name`). */
  async function requireFreeName(
    conn: DatabaseConnection,
    name: string,
    skillId: string | null,
  ): Promise<void> {
    const other = await skillsRepo(conn).findOne({ filter: { slug: name } });
    if (other && other.id !== skillId)
      throw frontMatterInvalid([
        {
          field: 'name',
          reason: 'taken',
          message: `Another skill is named ${name}; choose another \`name\`.`,
        },
      ]);
  }

  const attachIn = async (
    conn: DatabaseConnection,
    target: SkillTarget,
    skillIds: readonly string[],
  ): Promise<string[]> => {
    const unique = [...new Set(skillIds)];
    if (unique.length > 0) {
      const found = await skillsRepo(conn).findMany({
        filter: (f) => f.or(unique.map((id) => f.string('id').eq(id))),
      });
      if (found.length !== unique.length)
        throw invalid('Some of the skills do not exist.', {
          skillIds: unique.filter((id) => !found.some((s) => s.id === id)),
        });
    }
    return replaceAttachments(
      conn,
      target.scope,
      target.scopeId,
      unique,
      () => ids.next(),
      clock.now().toISOString(),
    );
  };

  const createWith = async (
    userId: string | null,
    input: SkillInput,
    note: string | null = null,
  ): Promise<SkillDetail> => {
    const checked = checkedSkill(input.content);
    await requireFreeName(tx.read(), checked.name, null);
    const manifest = await manifestFor(input.files ?? [], checked.content);
    return tx.run(async ({ conn }) => {
      const now = clock.now().toISOString();
      const id = ids.next();
      await requireFreeName(conn, checked.name, null);
      await skillsRepo(conn).createOne({
        values: {
          id,
          slug: checked.name,
          name: checked.name,
          description: checked.description,
          currentVersion: 1,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
        },
      });
      await writeVersion(
        conn,
        id,
        1,
        { ...checked, manifest, note },
        userId,
        now,
      );
      return detail(conn, id);
    });
  };

  const saveWith = async (
    id: string,
    userId: string | null,
    save: SkillSave,
  ): Promise<SkillDetail> => {
    const checked = checkedSkill(save.content);
    requireRevision(await requireSkill(tx.read(), id), save.expectedRevision);
    await requireFreeName(tx.read(), checked.name, id);
    const manifest = await manifestFor(save.files, checked.content);
    return tx.run(async ({ conn }) => {
      const skill = await requireSkill(conn, id);
      requireRevision(skill, save.expectedRevision);
      await writeVersion(
        conn,
        id,
        Number(skill.currentVersion) + 1,
        { ...checked, manifest, note: save.note ?? null },
        userId,
        clock.now().toISOString(),
      );
      return detail(conn, id);
    });
  };

  return {
    async list() {
      const conn = tx.read();
      const skills = await skillsRepo(conn).findMany({
        sort: (sort) => [sort.field('name').asc(), sort.field('id').asc()],
      });
      const counts = await agentCounts(conn);
      const result: Skill[] = [];
      for (const skill of skills) {
        const current = await versionsRepo(conn).findOne({
          filter: { skillId: skill.id, version: skill.currentVersion },
        });
        result.push(summary(skill, current, counts.get(skill.id) ?? 0));
      }
      return result;
    },

    get: (id) => detail(tx.read(), id),

    create: (userId, input) => createWith(userId, input),

    save: (id, userId, save) => saveWith(id, userId, save),

    remove: (id) =>
      tx.run(async ({ conn }) => {
        await requireSkill(conn, id);
        await attachmentsRepo(conn).deleteMany({ filter: { skillId: id } });
        await versionsRepo(conn).deleteMany({ filter: { skillId: id } });
        await skillsRepo(conn).deleteMany({ filter: { id } });
      }),

    async versions(id) {
      const conn = tx.read();
      await requireSkill(conn, id);
      const rows = await versionsRepo(conn).findMany({
        filter: { skillId: id },
        sort: (sort) => sort.field('version').desc(),
      });
      const names = await people.names(
        conn,
        rows.map((row) => row.createdById),
      );
      return rows.map((row) => ({
        version: Number(row.version),
        name: row.name,
        description: row.description,
        note: row.note,
        createdById: row.createdById,
        createdByName: row.createdById
          ? (names.get(row.createdById) ?? null)
          : null,
        createdAt: row.createdAt,
      }));
    },

    async version(id, version) {
      const conn = tx.read();
      const skill = await requireSkill(conn, id);
      const row = await versionOf(conn, id, version);
      const names = await people.names(conn, [row.createdById]);
      return {
        version: Number(row.version),
        name: row.name,
        description: row.description,
        note: row.note,
        createdById: row.createdById,
        createdByName: row.createdById
          ? (names.get(row.createdById) ?? null)
          : null,
        createdAt: row.createdAt,
        content: deliveredMarkdown(skill.slug, row.description, row.content),
        files: await entriesOf(manifestOf(row.manifest)),
      };
    },

    restore: (id, version, userId, expectedRevision) =>
      tx.run(async ({ conn }) => {
        const skill = await requireSkill(conn, id);
        requireRevision(skill, expectedRevision);
        if (version === Number(skill.currentVersion))
          throw precondition(
            'SKILL_VERSION_CURRENT',
            'That version is already the current one.',
          );
        const old = await versionOf(conn, id, version);
        // A version saved before front matter named skills gets it, under the skill's current name.
        const content = parseSkillMarkdown(old.content).problems.length
          ? deliveredMarkdown(skill.slug, old.description, old.content)
          : old.content;
        await writeVersion(
          conn,
          id,
          Number(skill.currentVersion) + 1,
          {
            ...checkedSkill(content),
            manifest: manifestOf(old.manifest),
            note: `Restored version ${version}`,
          },
          userId,
          clock.now().toISOString(),
        );
        return detail(conn, id);
      }),

    attached: (target) =>
      attachedSkillIds(tx.read(), target.scope, target.scopeId),

    attach: (target, skillIds, conn) =>
      conn
        ? attachIn(conn, target, skillIds)
        : tx.run(({ conn: inner }) => attachIn(inner, target, skillIds)),

    async forRun(conn, targets, runId) {
      const seenIds = new Set<string>();
      const seenSlugs = new Set<string>();
      const skills: RunSkill[] = [];
      for (const target of targets) {
        for (const skillId of await attachedSkillIds(
          conn,
          target.scope,
          target.scopeId,
        )) {
          if (seenIds.has(skillId)) continue;
          seenIds.add(skillId);
          const skill = await skillsRepo(conn).findOne({
            filter: { id: skillId },
          });
          if (!skill || seenSlugs.has(skill.slug)) continue;
          seenSlugs.add(skill.slug);
          const current = await versionOf(
            conn,
            skill.id,
            Number(skill.currentVersion),
          );
          skills.push({
            slug: skill.slug,
            name: skill.name,
            version: String(skill.currentVersion),
            hash: current.contentHash,
            description: skill.description,
            bundleUrl: routePath(RUNNER_ROUTES.skill, {
              runId,
              slug: skill.slug,
            }),
          });
        }
      }
      return skills;
    },

    async bundle(conn, slug) {
      const skill = await skillsRepo(conn).findOne({ filter: { slug } });
      if (!skill) throw notFound('Skill');
      const current = await versionOf(
        conn,
        skill.id,
        Number(skill.currentVersion),
      );
      const cached = bundles.get(current.contentHash);
      if (cached) return cached;
      const manifest = manifestOf(current.manifest);
      const files = await bundleFiles(
        deliveredMarkdown(skill.slug, current.description, current.content),
        manifest,
        (hash) => blobs.read(hash),
      );
      const bundle = toBundle(
        skill.slug,
        Number(skill.currentVersion),
        current.contentHash,
        files,
      );
      bundles.set(
        current.contentHash,
        bundle,
        files.reduce((sum, file) => sum + file.content.length, 0),
      );
      return bundle;
    },

    async upload(bytes) {
      if (bytes.length > SKILL_UPLOAD_MAX_BYTES)
        throw invalid(
          `An upload is at most ${formatBytes(SKILL_UPLOAD_MAX_BYTES)}.`,
        );
      const blob = await blobs.store(bytes);
      return { id: blob.hash, size: blob.size, text: blob.text };
    },

    async file(id, version, path) {
      const conn = tx.read();
      await requireSkill(conn, id);
      const row = await versionOf(conn, id, version);
      const entry = manifestOf(row.manifest).find((item) => item.path === path);
      if (!entry) throw notFound('Skill file');
      return { path: entry.path, bytes: await blobs.read(entry.blobHash) };
    },

    async exportArchive(id, version) {
      const conn = tx.read();
      const skill = await requireSkill(conn, id);
      const row = await versionOf(
        conn,
        id,
        version ?? Number(skill.currentVersion),
      );
      const entries: ZipEntry[] = [
        {
          name: `${skill.slug}/SKILL.md`,
          bytes: Buffer.from(
            deliveredMarkdown(skill.slug, row.description, row.content),
            'utf8',
          ),
          executable: false,
        },
      ];
      for (const entry of manifestOf(row.manifest).sort((a, b) =>
        a.path.localeCompare(b.path),
      ))
        entries.push({
          name: `${skill.slug}/${entry.path}`,
          bytes: await blobs.read(entry.blobHash),
          executable: entry.executable,
        });
      return {
        filename: `${skill.slug}-v${Number(row.version)}.zip`,
        bytes: writeZip(entries),
      };
    },

    async importArchive(userId, input) {
      const conn = tx.read();
      if (!(await blobs.info(conn, [input.archive])).has(input.archive))
        throw invalid('The archive is not uploaded; upload it first.');
      let entries: ZipEntry[];
      try {
        entries = readZip(
          await blobs.read(input.archive),
          SKILL_MAX_BYTES + SKILL_CONTENT_MAX_BYTES,
        );
      } catch (error) {
        if (error instanceof ZipError) throw invalid(error.message);
        throw error;
      }
      const archive = skillOfArchive(entries);
      const parsed = parseSkillMarkdown(archive.markdown);
      const name = parsed.frontMatter.name;
      if (
        parsed.problems.length === 0 &&
        archive.folder &&
        name !== archive.folder
      )
        throw frontMatterInvalid([
          {
            field: 'name',
            reason: 'mismatch',
            message: `The front matter's name ${name ?? ''} is not the name of the folder holding it, ${archive.folder}.`,
          },
        ]);
      const content = checkedSkill(archive.markdown).content;
      const files: SkillFileInput[] = [];
      for (const entry of archive.files) {
        if (entry.bytes.length > SKILL_FILE_MAX_BYTES)
          throw tooLarge(entry.name);
        files.push({
          path: entry.name,
          hash: (await blobs.store(entry.bytes)).hash,
          executable: entry.executable,
        });
      }
      if (!input.skillId)
        return createWith(userId, { content, files }, input.note ?? null);
      const skill = await requireSkill(conn, input.skillId);
      return saveWith(input.skillId, userId, {
        content,
        files,
        note: input.note ?? 'Imported from an archive',
        expectedRevision:
          input.expectedRevision ?? Number(skill.currentVersion),
      });
    },

    async snapshot(slug, hash) {
      const cached = snapshots.get(hash);
      if (cached) return cached;
      // By hash alone: the skill may have been renamed since the run was given it.
      const row = await versionsRepo(tx.read()).findOne({
        filter: { contentHash: hash },
      });
      if (!row) throw notFound('Skill version');
      const files: SkillSnapshot['files'][number][] = [];
      let size = 0;
      for (const entry of manifestOf(row.manifest)) {
        const text = entry.text
          ? Buffer.from(await blobs.read(entry.blobHash)).toString('utf8')
          : null;
        size += text === null ? 0 : entry.size;
        files.push({
          path: entry.path,
          size: entry.size,
          executable: entry.executable,
          text,
        });
      }
      const snapshot: SkillSnapshot = {
        slug,
        hash,
        markdown: deliveredMarkdown(slug, row.description, row.content),
        files: files.sort((a, b) => a.path.localeCompare(b.path)),
      };
      snapshots.set(hash, snapshot, size + snapshot.markdown.length);
      return snapshot;
    },

    collectGarbage: (graceMs) =>
      blobs.collect(async (conn) => {
        const named = new Set<string>();
        for (const row of await versionsRepo(conn).findMany({}))
          for (const entry of manifestOf(row.manifest))
            named.add(entry.blobHash);
        return named;
      }, graceMs),
  };
}
