/**
 * Proposing a file, for people who may propose in a space but not edit it: a new file entry, or a file's replacement.
 * The file and a reason go to `POST /api/knowledge/proposals/upload`; someone who may edit decides, and accepting it
 * makes the entry or its next version.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Field, FieldDescription, FieldLabel } from './ui/field.js';
import { Input } from './ui/input.js';
import { Spinner } from './ui/spinner.js';
import { Textarea } from './ui/textarea.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  KNOWLEDGE_REASON_MAX,
  type KnowledgeDoc,
  type SpaceRef,
} from '../../shared/knowledge.js';
import { useNotify } from '../hooks/use-notify.js';
import { knowledgeKeys, useKnowledgeApi } from '../api.js';

/** What the proposal makes: a new file in a space, or the next version of a file entry. */
export type ProposeFileTarget =
  | { readonly kind: 'create'; readonly space: SpaceRef }
  | {
      readonly kind: 'update';
      readonly doc: Pick<KnowledgeDoc, 'id' | 'title' | 'version'>;
    };

export function ProposeFileDialog({
  open,
  onOpenChange,
  target,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly target: ProposeFileTarget;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const propose = useMutation({
    mutationFn: () =>
      api.proposeFile(
        target.kind === 'create'
          ? { kind: 'create', space: target.space, reason: reason.trim() }
          : {
              kind: 'update',
              docId: target.doc.id,
              baseVersion: target.doc.version,
              reason: reason.trim(),
            },
        file!,
      ),
    onSuccess: () => {
      notify.success(t('knowledge.files.proposed'));
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      onOpenChange(false);
    },
    onError: (error) => notify.error(error),
  });
  const title =
    target.kind === 'create'
      ? t('knowledge.files.proposeNew')
      : t('knowledge.files.proposeReplace');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {target.kind === 'create'
              ? t('knowledge.files.proposeNewHint')
              : t('knowledge.files.proposeReplaceHint', {
                  title: target.doc.title,
                })}
          </DialogDescription>
        </DialogHeader>
        <form
          id='knowledge-propose-file'
          className='space-y-4'
          onSubmit={(event) => {
            event.preventDefault();
            if (file && reason.trim()) propose.mutate();
          }}
        >
          <Field>
            <FieldLabel htmlFor='knowledge-propose-file-input'>
              {t('knowledge.files.file')}
            </FieldLabel>
            <Input
              id='knowledge-propose-file-input'
              type='file'
              required
              onChange={(event) =>
                setFile(event.currentTarget.files?.[0] ?? null)
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='knowledge-propose-file-reason'>
              {t('knowledge.proposals.reason')}
            </FieldLabel>
            <Textarea
              id='knowledge-propose-file-reason'
              value={reason}
              required
              rows={3}
              maxLength={KNOWLEDGE_REASON_MAX}
              onChange={(event) => setReason(event.target.value)}
            />
            <FieldDescription>
              {t('knowledge.files.proposeReasonHint')}
            </FieldDescription>
          </Field>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('knowledge.editor.cancel')}
          </Button>
          <Button
            type='submit'
            form='knowledge-propose-file'
            disabled={!file || !reason.trim() || propose.isPending}
          >
            {propose.isPending ? <Spinner data-icon='inline-start' /> : null}
            {t('knowledge.files.propose')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
