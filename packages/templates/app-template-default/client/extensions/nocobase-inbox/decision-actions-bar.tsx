import { useTranslation } from '@nocobase/i18n/client';
import { SendIcon } from 'lucide-react';
import { type KeyboardEvent, type ReactElement, useState } from 'react';

import { Button } from '#components/ui/button';
import { Kbd } from '#components/ui/kbd';
import { Spinner } from '#components/ui/spinner';
import { Textarea } from '#components/ui/textarea';

export type ApprovalDecision = 'approve' | 'reject';

export interface DecisionActionsBarProps {
  readonly itemTitle: string;
  /** Other words for the two decisions, such as a design proposal's "Approve for development" and "Send back". */
  readonly labels?: Partial<Record<ApprovalDecision, string>>;
  /** The decision in flight. */
  readonly pending: ApprovalDecision | null;
  readonly disabled: boolean;
  readonly onRun: (decision: ApprovalDecision, comment: string) => void;
}

/**
 * The buttons of an approve-or-reject decision, for a renderer's `Actions`: approve (primary, first) decides at once;
 * reject (outline) opens an inline comment field first, which it needs (Enter sends, Shift + Enter starts a new line,
 * as the hint beside the buttons says). What the decision is about opens from the detail pane's title.
 */
export function DecisionActionsBar({
  itemTitle,
  pending,
  disabled,
  onRun,
  labels,
}: DecisionActionsBarProps): ReactElement {
  const { t } = useTranslation();
  const [commenting, setCommenting] = useState<ApprovalDecision | null>(null);
  const [comment, setComment] = useState('');
  const label = (decision: ApprovalDecision): string =>
    labels?.[decision] ??
    (decision === 'approve'
      ? t('inbox.request.approve', { defaultValue: 'Approve' })
      : t('inbox.request.reject', { defaultValue: 'Reject' }));

  function reset(): void {
    setCommenting(null);
    setComment('');
  }

  function send(): void {
    if (!commenting || !comment.trim()) return;
    onRun(commenting, comment.trim());
    reset();
  }

  if (commenting)
    return (
      <div className='w-full space-y-2' data-commenting={commenting}>
        <Textarea
          value={comment}
          rows={3}
          autoFocus
          placeholder={t('inbox.request.commentPlaceholder', {
            defaultValue: 'Write something…',
          })}
          aria-label={t('inbox.request.commentFor', {
            action: label(commenting),
            title: itemTitle,
            defaultValue: '{{action}}: {{title}}',
          })}
          onChange={(event) => setComment(event.target.value)}
          onKeyDown={(event) => {
            if (isSubmitEnter(event)) {
              event.preventDefault();
              send();
            }
            if (event.key === 'Escape') {
              event.stopPropagation();
              reset();
            }
          }}
        />
        <div className='flex flex-wrap items-center justify-end gap-2'>
          <SubmitHint />
          <Button variant='outline' onClick={reset}>
            {t('inbox.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button disabled={disabled || !comment.trim()} onClick={send}>
            <SendIcon data-icon='inline-start' />
            {label(commenting)}
          </Button>
        </div>
      </div>
    );

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        disabled={disabled || pending !== null}
        data-action='approve'
        onClick={() => onRun('approve', '')}
      >
        {pending === 'approve' ? <Spinner data-icon='inline-start' /> : null}
        {label('approve')}
      </Button>
      <Button
        variant='outline'
        disabled={disabled || pending !== null}
        data-action='reject'
        onClick={() => setCommenting('reject')}
      >
        {pending === 'reject' ? <Spinner data-icon='inline-start' /> : null}
        {label('reject')}
      </Button>
    </div>
  );
}

/** Enter sends a message box; Shift + Enter starts a new line, Alt + Enter is left alone, and an IME's Enter only confirms. */
function isSubmitEnter(event: KeyboardEvent): boolean {
  return (
    event.key === 'Enter' &&
    !event.shiftKey &&
    !event.altKey &&
    !event.nativeEvent.isComposing &&
    event.keyCode !== 229
  );
}

/** The keys of the comment box. */
function SubmitHint(): ReactElement {
  const { t } = useTranslation();
  return (
    <span className='mr-auto inline-flex items-center gap-1 text-xs text-muted-foreground'>
      <Kbd>Enter</Kbd>
      {t('inbox.request.quickSend', { defaultValue: 'to send' })}
      <Kbd className='ml-2'>Shift</Kbd>
      <Kbd>Enter</Kbd>
      {t('inbox.request.newLine', { defaultValue: 'for a new line' })}
    </span>
  );
}
