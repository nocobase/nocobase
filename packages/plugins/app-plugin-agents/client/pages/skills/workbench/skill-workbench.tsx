/**
 * A skill as a directory: the file tree on the left, the selected entry on the right, as a code editor lays them out
 * (stacked on a narrow screen). The page holding it keeps the draft (`useWorkbench`) and saves it; the workbench edits
 * it: files and folders created, uploaded (also by dropping files onto a folder), renamed and deleted from the tree,
 * and their contents edited in the pane. Read-only, it shows the skill the same way.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import {
  formatBytes,
  SKILL_CONTENT_MAX_BYTES,
  SKILL_FILE_MAX_BYTES,
  SKILL_MAX_BYTES,
  SKILL_MAX_FILES,
  type SkillFrontMatterProblem,
} from '../../../../shared/skills.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { baseName, saveBlob } from '../../../lib/download.js';
import {
  DeleteEntryDialog,
  EntryDialog,
  type EntryRequest,
} from './entry-dialog.js';
import { FilePane, type SavedSkill } from './file-pane.js';
import { FileTree, type FileTreeActions } from './file-tree.js';
import { checkDraft, type Workbench } from './state.js';
import {
  addFolder,
  entryProblem,
  freeName,
  join,
  removeEntry,
  renameEntry,
  SKILL_MD,
  type FileDraft,
  type TreeNode,
} from './model.js';

export function SkillWorkbench({
  state,
  editable,
  saved,
  serverProblems = [],
}: {
  readonly state: Workbench;
  readonly editable: boolean;
  /** The skill and version the draft started from, for its saved files; null for a new skill. */
  readonly saved: SavedSkill | null;
  /** What the server refused in the front matter on the last save. */
  readonly serverProblems?: readonly SkillFrontMatterProblem[];
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const { draft, setDraft, selected, setSelected, setUploading } = state;
  const [entry, setEntry] = useState<EntryRequest | null>(null);
  const [deleting, setDeleting] = useState<TreeNode | null>(null);
  const keyRef = useRef(draft.files.length);
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  });
  const inputRef = useRef<HTMLInputElement>(null);
  /** Where the next chosen files go: a folder, or the file they replace. */
  const targetRef = useRef<
    { readonly folder: string } | { readonly replace: FileDraft } | null
  >(null);
  const check = checkDraft(draft, state.uploading);
  const problems = [...check.problems, ...serverProblems];
  const file =
    selected === SKILL_MD
      ? null
      : (draft.files.find((item) => item.path === selected) ?? null);

  const nextKey = () => {
    keyRef.current += 1;
    return keyRef.current;
  };

  /** A file stored on the server and drafted: text to edit when it is text, else kept by its hash. */
  const stored = async (
    upload: File,
    path: string,
    executable: boolean,
    key: number,
  ): Promise<FileDraft | null> => {
    if (upload.size > SKILL_FILE_MAX_BYTES) {
      notify.error(
        null,
        t('skills.uploadTooLarge', {
          name: upload.name,
          max: formatBytes(SKILL_FILE_MAX_BYTES),
        }),
      );
      return null;
    }
    const result = await api.uploadSkillFile(upload);
    return result.text
      ? { key, path, executable, kind: 'text', content: await upload.text() }
      : {
          key,
          path,
          executable,
          kind: 'binary',
          hash: result.id,
          size: result.size,
          savedPath: null,
          blob: upload,
        };
  };

  const upload = async (folder: string, list: readonly File[]) => {
    setUploading((count) => count + list.length);
    // Named against the draft and what this upload added so far.
    const added: FileDraft[] = [];
    try {
      for (const item of list) {
        const current = draftRef.current;
        const base = {
          ...current,
          files: [
            ...current.files,
            ...added.filter(
              (one) => !current.files.some((other) => other.key === one.key),
            ),
          ],
        };
        if (base.files.length >= SKILL_MAX_FILES) {
          notify.error(
            null,
            t('skills.tooManyFiles', { max: SKILL_MAX_FILES }),
          );
          break;
        }
        const name = freeName(base, folder, item.name);
        if (entryProblem(base, folder, name, 'file')) {
          notify.error(
            null,
            t('skills.uploadInvalidName', { name: item.name }),
          );
          continue;
        }
        const path = join(folder, name);
        const next = await stored(item, path, false, nextKey());
        if (!next) continue;
        added.push(next);
        setDraft((current) => ({
          ...current,
          files: [...current.files, next],
        }));
      }
    } catch (error) {
      notify.error(error);
    } finally {
      setUploading((count) => count - list.length);
    }
  };

  const replace = async (old: FileDraft, item: File) => {
    setUploading((count) => count + 1);
    try {
      const next = await stored(item, old.path, old.executable, old.key);
      if (next)
        setDraft((current) => ({
          ...current,
          files: current.files.map((entryFile) =>
            entryFile.key === old.key ? next : entryFile,
          ),
        }));
    } catch (error) {
      notify.error(error);
    } finally {
      setUploading((count) => count - 1);
    }
  };

  const download = (target: FileDraft) => {
    if (target.kind !== 'binary') return;
    if (target.blob) {
      saveBlob(target.blob, baseName(target.path));
      return;
    }
    if (!saved || !target.savedPath) return;
    void api
      .skillFile(saved.id, saved.version, target.savedPath)
      .then((blob) => saveBlob(blob, baseName(target.path)))
      .catch((error: unknown) => notify.error(error));
  };

  const changeFile = (next: FileDraft) =>
    setDraft((current) => ({
      ...current,
      files: current.files.map((item) => (item.key === next.key ? next : item)),
    }));

  const actions: FileTreeActions | null = editable
    ? {
        newFile: (folder) => setEntry({ kind: 'newFile', folder }),
        newFolder: (folder) => setEntry({ kind: 'newFolder', folder }),
        upload: (folder, files) => {
          if (files) {
            void upload(folder, files);
            return;
          }
          targetRef.current = { folder };
          inputRef.current?.click();
        },
        rename: (node) => setEntry({ kind: 'rename', node }),
        remove: (node) => setDeleting(node),
        toggleExecutable: (target) =>
          changeFile({ ...target, executable: !target.executable }),
        download,
        replace: (target) => {
          targetRef.current = { replace: target };
          inputRef.current?.click();
        },
      }
    : null;

  const submitEntry = (path: string) => {
    if (!entry) return;
    if (entry.kind === 'rename') {
      const from = entry.node.path;
      setDraft((current) => renameEntry(current, from, path));
      if (selected === from) setSelected(path);
      else if (selected.startsWith(`${from}/`))
        setSelected(path + selected.slice(from.length));
    } else if (entry.kind === 'newFolder') {
      setDraft((current) => addFolder(current, path));
    } else {
      const key = nextKey();
      setDraft((current) => ({
        ...current,
        files: [
          ...current.files,
          { key, path, executable: false, kind: 'text', content: '' },
        ],
      }));
      setSelected(path);
    }
    setEntry(null);
  };

  return (
    // The tree keeps a fixed width beside the pane, as in a code editor.
    <div className='grid min-w-0 gap-4 md:grid-cols-[16rem_minmax(0,1fr)]'>
      <div className='flex min-w-0 flex-col gap-2'>
        <FileTree
          draft={draft}
          selected={file ? selected : SKILL_MD}
          onSelect={setSelected}
          actions={actions}
          skillProblems={editable && problems.length > 0}
        />
        <p className='px-2 text-xs text-muted-foreground tabular-nums'>
          {t('skills.usage', {
            files: draft.files.length,
            maxFiles: SKILL_MAX_FILES,
            size: formatBytes(check.total),
            maxSize: formatBytes(SKILL_MAX_BYTES),
          })}
        </p>
        {editable && (check.tooLarge || check.tooMany) ? (
          <p className='px-2 text-xs text-destructive'>
            {check.tooMany
              ? t('skills.tooManyFiles', { max: SKILL_MAX_FILES })
              : t('skills.skillTooLarge', {
                  max: formatBytes(SKILL_MAX_BYTES),
                })}
          </p>
        ) : null}
        {editable && check.filesTooLarge.length > 0 ? (
          <p className='px-2 text-xs text-destructive'>
            {t('skills.filesTooLarge', {
              paths: check.filesTooLarge.join(', '),
              max: formatBytes(SKILL_FILE_MAX_BYTES),
            })}
          </p>
        ) : null}
        {editable && check.contentTooLarge ? (
          <p className='px-2 text-xs text-destructive'>
            {t('skills.contentTooLarge', {
              max: formatBytes(SKILL_CONTENT_MAX_BYTES),
            })}
          </p>
        ) : null}
      </div>
      <FilePane
        content={draft.content}
        file={file}
        problems={problems}
        editable={editable}
        saved={saved}
        onContentChange={(content) =>
          setDraft((current) => ({ ...current, content }))
        }
        onFileChange={changeFile}
        onDownload={download}
        onReplace={(target) => actions?.replace(target)}
      />
      {editable ? (
        <input
          ref={inputRef}
          type='file'
          multiple
          hidden
          data-testid='skill-file-upload'
          onChange={(event) => {
            const list = [...(event.target.files ?? [])];
            event.target.value = '';
            const target = targetRef.current;
            targetRef.current = null;
            if (list.length === 0) return;
            if (target && 'replace' in target)
              void replace(target.replace, list[0]);
            else void upload(target?.folder ?? '', list);
          }}
        />
      ) : null}
      {entry ? (
        <EntryDialog
          key={JSON.stringify(
            entry.kind === 'rename' ? entry.node.path : entry,
          )}
          request={entry}
          draft={draft}
          onClose={() => setEntry(null)}
          onSubmit={submitEntry}
        />
      ) : null}
      <DeleteEntryDialog
        node={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={(node) => {
          setDraft((current) => removeEntry(current, node.path));
          if (selected === node.path || selected.startsWith(`${node.path}/`))
            setSelected(SKILL_MD);
          setDeleting(null);
        }}
      />
    </div>
  );
}
