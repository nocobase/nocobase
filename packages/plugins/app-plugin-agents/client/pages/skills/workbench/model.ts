/**
 * The skill being edited, as the workbench holds it: `SKILL.md`, the supporting files and the folders shown in the
 * tree. A folder exists because a file is in it, or because it was just created (an empty folder is not saved). Paths
 * come from the tree: an entry is created or renamed by its name within a folder, checked before it is applied.
 */
import {
  composeSkillMarkdown,
  isSkillScript,
  skillFilePathProblem,
  SKILL_FOLDERS,
  type SkillDetail,
  type SkillFileInput,
  type SkillFilePathProblem,
} from '../../../../shared/skills.js';

export const SKILL_MD = 'SKILL.md';

export type FileDraft = {
  readonly key: number;
  readonly path: string;
  readonly executable: boolean;
} & (
  | { readonly kind: 'text'; readonly content: string }
  | {
      readonly kind: 'binary';
      readonly hash: string;
      readonly size: number;
      /** Where it is stored in the version the workbench opened; null for a file uploaded since. */
      readonly savedPath: string | null;
      /** The bytes of a file uploaded since, for its preview. */
      readonly blob: Blob | null;
    }
);

export interface SkillDraft {
  readonly content: string;
  readonly files: readonly FileDraft[];
  /** Folders created and still empty. */
  readonly folders: readonly string[];
}

export function draftOf(
  skill: Pick<SkillDetail, 'content' | 'files'>,
): SkillDraft {
  return {
    content: skill.content,
    files: skill.files.map((file, index): FileDraft =>
      file.content === null
        ? {
            key: index,
            path: file.path,
            executable: file.executable,
            kind: 'binary',
            hash: file.hash,
            size: file.size,
            savedPath: file.path,
            blob: null,
          }
        : {
            key: index,
            path: file.path,
            executable: file.executable,
            kind: 'text',
            content: file.content,
          },
    ),
    folders: [],
  };
}

export function filesInput(draft: SkillDraft): SkillFileInput[] {
  return draft.files.map((file) => ({
    path: file.path,
    ...(file.kind === 'text' ? { content: file.content } : { hash: file.hash }),
    ...(file.executable ? { executable: true } : {}),
  }));
}

export const isScript = (file: FileDraft): boolean => isSkillScript(file);

export const isMarkdown = (path: string): boolean =>
  /\.(md|markdown)$/iu.test(path);

export const parentOf = (path: string): string =>
  path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';

export const nameOf = (path: string): string =>
  path.slice(path.lastIndexOf('/') + 1);

export const join = (folder: string, name: string): string =>
  folder ? `${folder}/${name}` : name;

const under = (path: string, folder: string): boolean =>
  path.startsWith(`${folder}/`);

/** Every folder of the draft: those holding files and those created empty, sorted. */
export function foldersOf(draft: SkillDraft): string[] {
  const all = new Set<string>();
  for (const path of [
    ...draft.folders.map((folder) => `${folder}/`),
    ...draft.files.map((file) => file.path),
  ]) {
    let folder = parentOf(path);
    while (folder) {
      all.add(folder);
      folder = parentOf(folder);
    }
  }
  return [...all].sort((a, b) => a.localeCompare(b));
}

/** The folders a new entry may go in: the root, the draft's folders and the conventional ones. */
export function parentOptions(draft: SkillDraft): string[] {
  return [
    '',
    ...[...new Set([...foldersOf(draft), ...SKILL_FOLDERS])].sort((a, b) =>
      a.localeCompare(b),
    ),
  ];
}

export interface TreeNode {
  readonly kind: 'folder' | 'file';
  readonly name: string;
  readonly path: string;
  readonly children: readonly TreeNode[];
  readonly file: FileDraft | null;
}

/** The draft as a tree: folders before files, each by name. */
export function treeOf(draft: SkillDraft): TreeNode[] {
  const folders = foldersOf(draft);
  const build = (parent: string): TreeNode[] => [
    ...folders
      .filter((folder) => parentOf(folder) === parent)
      .map((folder): TreeNode => ({
        kind: 'folder',
        name: nameOf(folder),
        path: folder,
        children: build(folder),
        file: null,
      })),
    ...draft.files
      .filter((file) => parentOf(file.path) === parent)
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((file): TreeNode => ({
        kind: 'file',
        name: nameOf(file.path),
        path: file.path,
        children: [],
        file,
      })),
  ];
  return build('');
}

export type EntryNameProblem = 'required' | 'invalid' | 'taken' | 'reserved';

/** Why `name` cannot be an entry of `folder` (other than `self`, being renamed), or null. */
export function entryProblem(
  draft: SkillDraft,
  folder: string,
  name: string,
  kind: 'file' | 'folder',
  self: string | null = null,
): EntryNameProblem | null {
  const value = name.trim();
  if (!value) return 'required';
  if (value.includes('/') || value === '.' || value === '..') return 'invalid';
  const path = join(folder, value);
  if (path === self) return null;
  if (path === SKILL_MD) return 'reserved';
  const taken =
    draft.files.some((file) => file.path === path && file.path !== self) ||
    foldersOf(draft).some((other) => other === path && other !== self);
  if (taken) return 'taken';
  const others = draft.files
    .map((file) => file.path)
    .filter(
      (other) => other !== self && !(self !== null && under(other, self)),
    );
  const problem: SkillFilePathProblem | null =
    kind === 'file'
      ? skillFilePathProblem(path, others)
      : skillFilePathProblem(join(path, 'x'), others);
  if (problem === 'duplicate' || problem === 'conflict') return 'taken';
  if (problem) return 'invalid';
  return null;
}

/** The draft with `from` (a file, or a folder and everything in it) at `to`. */
export function renameEntry(
  draft: SkillDraft,
  from: string,
  to: string,
): SkillDraft {
  const move = (path: string) =>
    path === from
      ? to
      : under(path, from)
        ? to + path.slice(from.length)
        : path;
  return {
    ...draft,
    files: draft.files.map((file) => ({ ...file, path: move(file.path) })),
    folders: draft.folders.map(move),
  };
}

/** The draft without `path`: a file, or a folder and everything in it. */
export function removeEntry(draft: SkillDraft, path: string): SkillDraft {
  return {
    ...draft,
    files: draft.files.filter(
      (file) => file.path !== path && !under(file.path, path),
    ),
    folders: draft.folders.filter(
      (folder) => folder !== path && !under(folder, path),
    ),
  };
}

/** The draft with an empty folder at `path`. */
export function addFolder(draft: SkillDraft, path: string): SkillDraft {
  return { ...draft, folders: [...draft.folders, path] };
}

/** A free name for `name` in `folder`: `name`, else `name (2)`, `name (3)` and so on before its extension. */
export function freeName(
  draft: SkillDraft,
  folder: string,
  name: string,
): string {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : '';
  for (let n = 1; ; n += 1) {
    const candidate = n === 1 ? name : `${stem} (${n})${extension}`;
    if (entryProblem(draft, folder, candidate, 'file') !== 'taken')
      return candidate;
  }
}

/** A new skill's `SKILL.md`: front matter and the sections a skill usually has, in the reader's language. */
export function skillTemplate(text: {
  readonly description: string;
  readonly title: string;
  readonly whenToUse: string;
  readonly whenToUseHint: string;
  readonly steps: string;
  readonly stepsHint: string;
  readonly examples: string;
  readonly examplesHint: string;
}): string {
  return composeSkillMarkdown(
    { name: 'new-skill', description: text.description },
    [
      `# ${text.title}`,
      '',
      `## ${text.whenToUse}`,
      '',
      text.whenToUseHint,
      '',
      `## ${text.steps}`,
      '',
      text.stepsHint,
      '',
      `## ${text.examples}`,
      '',
      text.examplesHint,
      '',
    ].join('\n'),
  );
}
