/**
 * Naming an entry of the tree: a new file or folder in a folder chosen from the skill's folders and the conventional
 * ones (`scripts/`, `references/`, `assets/`), or a new name for an entry where it is. The name is checked on submit
 * and again as it changes after a refusal; a path is never typed.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type FormEvent, type ReactElement } from 'react';

import { SKILL_FOLDERS } from '../../../../shared/skills.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog.js';
import { Button } from '../../../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../../components/ui/field.js';
import { Input } from '../../../components/ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select.js';
import {
  entryProblem,
  join,
  nameOf,
  parentOf,
  parentOptions,
  type SkillDraft,
  type TreeNode,
} from './model.js';

export type EntryRequest =
  | { readonly kind: 'newFile' | 'newFolder'; readonly folder: string }
  | { readonly kind: 'rename'; readonly node: TreeNode };

const ROOT = '__root__';

export function EntryDialog({
  request,
  draft,
  onClose,
  onSubmit,
}: {
  readonly request: EntryRequest;
  readonly draft: SkillDraft;
  readonly onClose: () => void;
  /** The entry's path: created, or what `request.node` is renamed to. */
  readonly onSubmit: (path: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const renaming = request.kind === 'rename' ? request.node : null;
  const entryKind =
    request.kind === 'newFolder' || renaming?.kind === 'folder'
      ? 'folder'
      : 'file';
  const [folder, setFolder] = useState(() =>
    request.kind === 'rename' ? parentOf(request.node.path) : request.folder,
  );
  const [name, setName] = useState(() =>
    request.kind === 'rename' ? nameOf(request.node.path) : '',
  );
  const [submitted, setSubmitted] = useState(false);
  const problem = entryProblem(
    draft,
    folder,
    name,
    entryKind,
    renaming?.path ?? null,
  );
  const title = renaming
    ? t('skills.entry.renameTitle', { name: renaming.name })
    : entryKind === 'folder'
      ? t('skills.tree.newFolder')
      : t('skills.tree.newFile');
  const options = parentOptions(draft);
  const label = (value: string) =>
    value ? `${value}/` : t('skills.entry.root');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (problem) return;
    onSubmit(join(folder, name.trim()));
  };
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {entryKind === 'folder' && !renaming
              ? t('skills.entry.folderHint')
              : t('skills.entry.description')}
          </DialogDescription>
        </DialogHeader>
        <form id='ag-skill-entry' onSubmit={submit} noValidate>
          <FieldGroup>
            {renaming ? null : (
              <Field>
                <FieldLabel htmlFor='ag-skill-entry-folder'>
                  {t('skills.entry.location')}
                </FieldLabel>
                <Select
                  items={options.map((value) => ({
                    value: value || ROOT,
                    label: label(value),
                  }))}
                  value={folder || ROOT}
                  onValueChange={(next: string | null) =>
                    setFolder(!next || next === ROOT ? '' : next)
                  }
                >
                  <SelectTrigger id='ag-skill-entry-folder' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                    {options.map((value) => (
                      <SelectItem key={value || ROOT} value={value || ROOT}>
                        <span className='font-mono'>{label(value)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {SKILL_FOLDERS.includes(folder) ? (
                  <FieldDescription>
                    {t(`skills.entry.conventional.${folder}`)}
                  </FieldDescription>
                ) : null}
              </Field>
            )}
            <Field data-invalid={submitted && problem ? true : undefined}>
              <FieldLabel htmlFor='ag-skill-entry-name'>
                {t('skills.entry.name')}
              </FieldLabel>
              <Input
                id='ag-skill-entry-name'
                value={name}
                autoFocus
                maxLength={255}
                className='font-mono'
                placeholder={
                  entryKind === 'folder'
                    ? 'examples'
                    : folder === 'scripts'
                      ? 'run.sh'
                      : 'guide.md'
                }
                aria-invalid={submitted && problem ? true : undefined}
                onChange={(event) => setName(event.target.value)}
              />
              {submitted && problem ? (
                <FieldError>{t(`skills.entry.problems.${problem}`)}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button type='submit' form='ag-skill-entry'>
            {renaming ? t('skills.tree.rename') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Confirms deleting a file, or a folder with everything in it, from the draft. */
export function DeleteEntryDialog({
  node,
  onClose,
  onConfirm,
}: {
  readonly node: TreeNode | null;
  readonly onClose: () => void;
  readonly onConfirm: (node: TreeNode) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <AlertDialog
      open={node !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {node?.kind === 'folder'
              ? t('skills.entry.deleteFolderTitle', { name: node.path })
              : t('skills.entry.deleteFileTitle', { name: node?.path ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('skills.entry.deleteDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={() => {
              if (node) onConfirm(node);
            }}
          >
            {t('actions.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
