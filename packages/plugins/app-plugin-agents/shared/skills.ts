/**
 * The skill library as the browser and the server's admin API exchange it. A skill is a directory in the open Agent
 * Skills format (https://agentskills.io/specification): `SKILL.md`, whose front matter alone names and describes the
 * skill (`skill-markdown.ts`), and supporting files, text or binary, conventionally under `scripts/`, `references/`
 * and `assets/`. The front matter's `name` is the skill's slug and directory: renaming it renames the skill. Every save is a new version; agents always get the latest one, and an
 * older one can be compared and restored (as a new version). A file's bytes are stored once per content, by their
 * SHA-256, whichever versions and skills hold them; a version lists its files by that hash.
 *
 * Skills are attached to agents, and as defaults to a working directory (`workdir`) or to a scope the application
 * registers: a run gets the agent's skills and the defaults of its subject's scopes and of the directories it works in.
 */

/** `agent`, `workdir` or a scope key the application registered. */
export type SkillScope = string;

export interface Skill {
  readonly id: string;
  /** The directory name: the `name` of its front matter, which renames it. */
  readonly slug: string;
  /** The front matter's `name`, the same as `slug`. */
  readonly name: string;
  readonly description: string;
  /** The front matter's `compatibility`, what the skill needs of its environment; null when it says nothing. */
  readonly compatibility: string | null;
  /**
   * The current version, from 1, and the skill's revision: a save or a restore names the version it was made against
   * (`expectedRevision`) and is refused with 409 when another save came first.
   */
  readonly version: number;
  readonly fileCount: number;
  /** The bytes of `SKILL.md` and every file. */
  readonly size: number;
  /** Files that are scripts (executable, or under `scripts/`): an online agent reads them but never runs them. */
  readonly scriptCount: number;
  /** Their paths. */
  readonly scripts: readonly string[];
  readonly agentCount: number;
  readonly createdById: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SkillFileEntry {
  /** Relative to the skill's directory, such as `scripts/check.sh`. */
  readonly path: string;
  /** SHA-256 of its bytes, hex: where they are stored. */
  readonly hash: string;
  readonly size: number;
  /** Placed with the executable bit, as a script. */
  readonly executable: boolean;
  /** Its text; null for a binary file, which is downloaded instead. */
  readonly content: string | null;
}

/**
 * A file of a save: its `content` as text, or the `hash` of bytes already stored (a file kept as it was, moved, or
 * uploaded first with `POST /skills/uploads`).
 */
export interface SkillFileInput {
  readonly path: string;
  readonly content?: string;
  readonly hash?: string;
  readonly executable?: boolean;
}

/** What `POST /skills/uploads` stored: `id` is the bytes' SHA-256, which a save or an import names. */
export interface SkillUpload {
  readonly id: string;
  readonly size: number;
  /** Whether the bytes are text (UTF-8 without NUL bytes). */
  readonly text: boolean;
}

/**
 * Importing a zip in the Agent Skills layout (`SKILL.md` at its root or in its single top folder, which is named as its
 * front matter's `name`): a new skill, or with `skillId` a new version of that skill. It is checked as a save is.
 */
export interface SkillImport {
  /** The upload holding the zip (`SkillUpload.id`). */
  readonly archive: string;
  readonly skillId?: string;
  /** With `skillId`: the version the import was made against. */
  readonly expectedRevision?: number;
  readonly note?: string | null;
}

export interface SkillAttachment {
  readonly scope: SkillScope;
  readonly scopeId: string;
  /** The agent's name for `agent`; null where this plugin cannot name it. */
  readonly name: string | null;
}

export interface SkillDetail extends Skill {
  /** `SKILL.md`, front matter and body, as written. */
  readonly content: string;
  readonly files: readonly SkillFileEntry[];
  readonly attachments: readonly SkillAttachment[];
}

/** A skill as its page reads it (`GET /skills/:id`): with whether the caller may edit it. */
export interface SkillView extends SkillDetail {
  readonly canEdit: boolean;
}

export interface SkillVersion {
  readonly version: number;
  readonly name: string;
  readonly description: string;
  readonly note: string | null;
  readonly createdById: string | null;
  readonly createdByName: string | null;
  readonly createdAt: string;
}

export interface SkillVersionDetail extends SkillVersion {
  readonly content: string;
  readonly files: readonly SkillFileEntry[];
}

/** Creating a skill: its `SKILL.md`, whose front matter names and describes it, and its files. */
export interface SkillInput {
  readonly content: string;
  readonly files?: readonly SkillFileInput[];
}

/** Saving a skill: a new version with everything it holds. A new front matter `name` renames it. */
export interface SkillSave {
  readonly content: string;
  readonly files: readonly SkillFileInput[];
  readonly note?: string | null;
  /** The version the edit was made against. */
  readonly expectedRevision: number;
}

/** Restoring an older version (`POST /skills/:id/versions/:version/restore`). */
export interface SkillRestore {
  /** The version current when the restore was asked for. */
  readonly expectedRevision: number;
}

/** Files a skill holds besides `SKILL.md`. */
export const SKILL_MAX_FILES: number = 200;
/** The largest file. */
export const SKILL_FILE_MAX_BYTES: number = 5 * 1024 * 1024;
/** The whole skill: `SKILL.md` and its files. */
export const SKILL_MAX_BYTES: number = 20 * 1024 * 1024;
/** The body of `SKILL.md`. */
export const SKILL_CONTENT_MAX_BYTES: number = 200 * 1024;
/** One upload: a file, or a zip to import. */
export const SKILL_UPLOAD_MAX_BYTES: number = 25 * 1024 * 1024;

/** The folders the specification names: code agents run, documentation they read, and templates and resources. */
export const SKILL_FOLDERS: readonly string[] = [
  'scripts',
  'references',
  'assets',
];

/** A file an agent may run: executable, or under `scripts/`. Online agents read scripts but never run them. */
export function isSkillScript(file: {
  readonly path: string;
  readonly executable: boolean;
}): boolean {
  return file.executable || file.path.startsWith('scripts/');
}

/** A size for people: `512 B`, `12.5 KB`, `3.1 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * - `required`, `invalid`: no path, or not a relative path of plain names (no `.`, `..`, backslashes or control characters),
 *   or `SKILL.md`, which is the body rather than a file.
 * - `duplicate`: another file has it; `conflict`: it is a folder of another file, or one of its folders is a file.
 */
export type SkillFilePathProblem =
  'required' | 'invalid' | 'duplicate' | 'conflict';

/** Why `path` cannot name a supporting file among `others`, or null. */
export function skillFilePathProblem(
  path: string,
  others: readonly string[] = [],
): SkillFilePathProblem | null {
  const value = path.trim();
  if (!value) return 'required';
  const parts = value.split('/');
  if (
    value.startsWith('/') ||
    value.includes('\\') ||
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001f\u007f]/u.test(value) ||
    parts.some(
      (part) =>
        part === '' || part === '.' || part === '..' || part !== part.trim(),
    ) ||
    value.length > 255 ||
    value === 'SKILL.md'
  )
    return 'invalid';
  if (others.includes(value)) return 'duplicate';
  if (
    others.some(
      (other) => other.startsWith(`${value}/`) || value.startsWith(`${other}/`),
    )
  )
    return 'conflict';
  return null;
}

export {
  composeSkillMarkdown,
  parseSkillMarkdown,
  skillNameProblem,
  SKILL_COMPATIBILITY_MAX,
  SKILL_DESCRIPTION_MAX,
  SKILL_NAME_MAX,
  type ParsedSkillMarkdown,
  type SkillFrontMatter,
  type SkillFrontMatterField,
  type SkillFrontMatterProblem,
  type SkillFrontMatterReason,
} from './skill-markdown.js';
