/**
 * Sending work back to the agent that wrote it, with what should change: a pending proposal
 * (`POST …/proposals/:proposalId/requestChanges`), or a document's current version an agent wrote
 * (`POST …/docs/:docId/requestChanges`). The application wakes the agent where it worked, and the proposal it submits
 * replaces the one sent back and is reviewed like any other.
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
import { Spinner } from './ui/spinner.js';
import { Textarea } from './ui/textarea.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  KNOWLEDGE_COMMENT_MAX,
  type KnowledgeDoc,
  type KnowledgeProposal,
} from '../../shared/knowledge.js';
import { useNotify } from '../hooks/use-notify.js';
import { knowledgeKeys, useKnowledgeApi } from '../api.js';

/** What is sent back: a proposal, or a document at its current version. */
export type RequestChangesTarget =
  | {
      readonly kind: 'proposal';
      readonly proposal: Pick<KnowledgeProposal, 'id' | 'proposer'>;
    }
  | {
      readonly kind: 'doc';
      readonly doc: Pick<
        KnowledgeDoc,
        'id' | 'title' | 'version' | 'updatedBy'
      >;
    };

export function RequestChangesDialog({
  open,
  onOpenChange,
  target,
  onSent,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly target: RequestChangesTarget;
  readonly onSent?: (proposal: KnowledgeProposal) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const agent =
    (target.kind === 'proposal'
      ? target.proposal.proposer.name
      : target.doc.updatedBy.name) ?? t('knowledge.someone');
  const send = useMutation({
    mutationFn: () =>
      target.kind === 'proposal'
        ? api.requestChanges(target.proposal.id, { comment: comment.trim() })
        : api.requestDocChanges(target.doc.id, { comment: comment.trim() }),
    onSuccess: (proposal) => {
      notify.success(t('knowledge.revisions.sent', { name: agent }));
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      onOpenChange(false);
      onSent?.(proposal);
    },
    onError: (error) => notify.error(error),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {target.kind === 'proposal'
              ? t('knowledge.revisions.sendBack')
              : t('knowledge.revisions.askAgent')}
          </DialogTitle>
          <DialogDescription>
            {target.kind === 'proposal'
              ? t('knowledge.revisions.sendBackHint', { name: agent })
              : t('knowledge.revisions.askAgentHint', {
                  name: agent,
                  version: target.doc.version,
                })}
          </DialogDescription>
        </DialogHeader>
        <form
          id='knowledge-request-changes'
          onSubmit={(event) => {
            event.preventDefault();
            if (comment.trim()) send.mutate();
          }}
        >
          <Field>
            <FieldLabel htmlFor='knowledge-request-changes-comment'>
              {t('knowledge.revisions.comment')}
            </FieldLabel>
            <Textarea
              id='knowledge-request-changes-comment'
              value={comment}
              required
              rows={4}
              maxLength={KNOWLEDGE_COMMENT_MAX}
              onChange={(event) => setComment(event.target.value)}
            />
            <FieldDescription>
              {t('knowledge.revisions.commentHint')}
            </FieldDescription>
          </Field>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('knowledge.editor.cancel')}
          </Button>
          <Button
            type='submit'
            form='knowledge-request-changes'
            data-action='request-changes'
            disabled={!comment.trim() || send.isPending}
          >
            {send.isPending ? <Spinner data-icon='inline-start' /> : null}
            {t('knowledge.revisions.send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
