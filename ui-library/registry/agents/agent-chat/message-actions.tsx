/** Message-local controls; the conversation owns editing and resend admission. */
import { CopyIcon, PencilIcon, RefreshCwIcon } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { Button } from '#components/ui/button';
import { Textarea } from '#components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { useChatTranslation } from './chat-i18n.js';

function ActionButton({
  label,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            disabled={disabled}
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function MessageActions({
  text,
  disabled,
  onEdit,
  onRefresh,
}: {
  readonly text: string;
  readonly disabled?: boolean;
  readonly onEdit?: () => void;
  readonly onRefresh?: () => void;
}): ReactElement {
  const { t } = useChatTranslation();
  const [copyError, setCopyError] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <div
      className='flex flex-wrap items-center gap-1'
      data-chat-message-actions
    >
      {onEdit ? (
        <ActionButton
          label={t('chat.editMessage')}
          disabled={disabled}
          onClick={onEdit}
        >
          <PencilIcon aria-hidden='true' />
        </ActionButton>
      ) : null}
      <ActionButton
        label={t('chat.copyMessage')}
        disabled={!text.trim()}
        onClick={() => void copy()}
      >
        <CopyIcon aria-hidden='true' />
      </ActionButton>
      {onRefresh ? (
        <ActionButton
          label={t('chat.refreshReply')}
          disabled={disabled}
          onClick={onRefresh}
        >
          <RefreshCwIcon aria-hidden='true' />
        </ActionButton>
      ) : null}
      {copyError ? (
        <span role='status' className='text-xs text-destructive'>
          {t('chat.copyFailed')}
        </span>
      ) : null}
    </div>
  );
}

export function MessageEditor({
  text,
  disabled,
  hasFiles,
  onChange,
  onCancel,
  onSend,
}: {
  readonly text: string;
  readonly disabled: boolean;
  readonly hasFiles: boolean;
  readonly onChange: (text: string) => void;
  readonly onCancel: () => void;
  readonly onSend: () => void;
}): ReactElement {
  const { t } = useChatTranslation();
  return (
    <div className='flex min-w-0 flex-col gap-2.5' data-chat-message-editor>
      <Textarea
        className='min-h-20 resize-none bg-background px-3.5 py-3 leading-relaxed shadow-none focus-visible:ring-2 focus-visible:ring-ring/20 dark:bg-background'
        aria-label={t('chat.editMessage')}
        value={text}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
      />
      <div className='flex justify-end gap-2'>
        <Button
          variant='ghost'
          size='sm'
          disabled={disabled}
          onClick={onCancel}
        >
          {t('chat.cancel')}
        </Button>
        <Button
          size='sm'
          disabled={
            disabled ||
            (!text.trim() && !hasFiles) ||
            Array.from(text).length > 50_000
          }
          onClick={onSend}
        >
          {t('chat.composer.send')}
        </Button>
      </div>
    </div>
  );
}
